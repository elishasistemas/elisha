#!/usr/bin/env node

/**
 * Script para tornar todas as migrations idempotentes
 * 
 * Corrige automaticamente:
 * 1. CREATE POLICY sem DROP POLICY IF EXISTS antes (padrão simples)
 * 2. do $$ blocks checando pg_policies - substitui por DROP/CREATE
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

/**
 * Processa um arquivo de migration e corrige policies não idempotentes
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const changes = [];
  
  // Pattern 1: do $$ blocks com pg_policies check
  // Procura: do $$ ... if not exists (select 1 from pg_policies where policyname = 'X' ...) ... create policy ...
  const doBlockPattern = /do\s+\$\$\s*\n\s*begin\s*\n\s*if\s+not\s+exists\s*\(\s*\n\s*select\s+1\s+from\s+pg_policies\s+where\s+(?:polname|policyname)\s*=\s*['"]([\w_]+)['"]\s+and\s+tablename\s*=\s*['"]([\w_]+)['"]\s*\)\s+then\s*\n([\s\S]*?)end\s+if;\s*\nend\$\$/gims;
  
  content = content.replace(doBlockPattern, (match, policyName, tableName, body) => {
    changed = true;
    
    // Extrair o CREATE POLICY do body
    const createPolicyMatch = body.match(/create\s+policy\s+(\w+)\s+on\s+([^\s]+)\s+(for\s+\w+)\s+((?:using|with\s+check)\s*\([\s\S]*?\))/gims);
    
    if (!createPolicyMatch) {
      // Tentar padrão mais genérico
      const createMatch = body.match(/create\s+policy\s+(\w+)\s+on\s+([^\s]+)\s+(for\s+\w+)[\s\S]*?;/gims);
      if (!createMatch) {
        changes.push(`⚠️  Could not extract CREATE POLICY from do $$ block for ${policyName}`);
        return match; // Não conseguiu, mantém original
      }
    }
    
    // Normalizar CREATE POLICY
    const createPolicy = createPolicyMatch?.[0] || body.match(/create\s+policy[\s\S]*?;/gims)?.[0];
    if (!createPolicy) {
      changes.push(`⚠️  Could not extract CREATE POLICY from do $$ block for ${policyName}`);
      return match;
    }
    
    // Extrair componentes
    const policyRegex = /create\s+policy\s+(\w+)\s+on\s+([^\s]+)\s+(for\s+\w+)\s+((?:using|with\s+check)\s*\([\s\S]*?\))/gims;
    const policyParts = createPolicy.match(policyRegex);
    
    if (!policyParts) {
      // Padrão simplificado
      const simpleMatch = createPolicy.match(/create\s+policy\s+(\w+)\s+on\s+([^\s]+)\s+(for\s+\w+)\s+(using|with\s+check)\s*\([\s\S]*?\)/gims);
      if (!simpleMatch) {
        changes.push(`⚠️  Could not parse CREATE POLICY for ${policyName}`);
        return match;
      }
    }
    
    // Normalizar para formato padrão
    const normalized = createPolicy
      .replace(/^\s*create\s+policy/i, 'CREATE POLICY')
      .replace(/\s+on\s+/i, '\n  ON ')
      .replace(/\s+(for\s+\w+)/i, (m) => `\n  ${m.trim().toUpperCase()}`)
      .replace(/\s+(using|with\s+check)\s*\(/i, (m, check) => `\n  ${check.toUpperCase()} (`)
      .trim();
    
    // Criar versão idempotente
    const indent = match.substring(0, match.indexOf('do')).match(/^(\s*)/)?.[1] || '';
    const newPolicy = `${indent}DROP POLICY IF EXISTS ${policyName} ON ${tableName};\n${normalized};\n`;
    
    changes.push(`Replaced do $$ block for policy ${policyName} on ${tableName}`);
    return newPolicy;
  });
  
  // Pattern 2: CREATE POLICY sem DROP antes (mais simples)
  // Procura CREATE POLICY que não tem DROP POLICY IF EXISTS antes na mesma seção
  const lines = content.split('\n');
  const newLines = [];
  let lastPolicyMatch = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const policyMatch = line.match(/^\s*CREATE\s+POLICY\s+(\w+)\s+ON\s+([^\s]+)/i);
    
    if (policyMatch) {
      // Verificar se tem DROP antes nas últimas 10 linhas
      const context = lines.slice(Math.max(0, i - 10), i).join('\n');
      const hasDrop = context.match(new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+${policyMatch[1]}\\s+ON\\s+${policyMatch[2]}`, 'i'));
      
      if (!hasDrop) {
        // Adicionar DROP POLICY IF EXISTS antes
        const indent = line.match(/^(\s*)/)?.[1] || '';
        const commentLines = [];
        
        // Capturar comentários anteriores
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim().startsWith('--')) {
            commentLines.unshift(lines[j]);
          } else if (lines[j].trim() === '') {
            continue;
          } else {
            break;
          }
        }
        
        // Inserir DROP POLICY IF EXISTS
        commentLines.forEach(cl => newLines.push(cl));
        newLines.push(`${indent}DROP POLICY IF EXISTS ${policyMatch[1]} ON ${policyMatch[2]};`);
        changed = true;
        changes.push(`Added DROP POLICY IF EXISTS for ${policyMatch[1]} on ${policyMatch[2]}`);
      }
    }
    
    newLines.push(line);
  }
  
  return {
    content: changed ? newLines.join('\n') : content,
    changed,
    changes
  };
}

/**
 * Função principal
 */
function main() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.endsWith('.bak'))
    .map(f => path.join(MIGRATIONS_DIR, f));
  
  console.log(`🔍 Scanning ${files.length} migration files...\n`);
  
  let totalFilesChanged = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    const fileName = path.basename(file);
    const result = processFile(file);
    
    if (result.changed) {
      fs.writeFileSync(file, result.content, 'utf8');
      totalFilesChanged++;
      totalChanges += result.changes.length;
      
      console.log(`✅ ${fileName}:`);
      result.changes.forEach(change => console.log(`   ${change}`));
      console.log();
    }
  }
  
  if (totalFilesChanged === 0) {
    console.log('🎉 All migrations are already idempotent!');
  } else {
    console.log(`✨ Done! Fixed ${totalChanges} issue(s) across ${totalFilesChanged} file(s).`);
    console.log('\n⚠️  Please review the changes before committing.');
    console.log('💡 Run: git diff supabase/migrations/');
  }
}

main();
