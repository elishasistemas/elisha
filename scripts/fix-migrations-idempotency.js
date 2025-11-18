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
  
  // Pattern 2: CREATE POLICY sem DROP antes (suporta multilinha)
  // Procura CREATE POLICY que pode estar em múltiplas linhas: CREATE POLICY ... ON ... FOR ...
  const createPolicyPattern = /CREATE\s+POLICY\s+(\w+)\s+ON\s+([^\s]+)\s+(?:FOR\s+\w+)?/gims;
  const policyMatches = [...content.matchAll(createPolicyPattern)];
  
  // Processar do final para o início para não afetar índices
  policyMatches.reverse().forEach(match => {
    const policyName = match[1];
    const tableName = match[2];
    const matchIndex = match.index;
    
    // Verificar se tem DROP antes nas últimas 20 linhas (para capturar comentários e linhas vazias)
    const contextStart = Math.max(0, matchIndex - 500);
    const context = content.substring(contextStart, matchIndex);
    const hasDrop = context.match(new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+${policyName}\\s+ON\\s+${tableName}`, 'i'));
    
    if (!hasDrop) {
      // Encontrar início da linha e comentários anteriores
      const beforeMatch = content.substring(0, matchIndex);
      const linesBefore = beforeMatch.split('\n');
      const lastNonEmptyLine = linesBefore.slice().reverse().find(l => l.trim() !== '' && !l.trim().startsWith('--'));
      const indent = lastNonEmptyLine?.match(/^(\s*)/)?.[1] || '  ';
      
      // Encontrar último comentário antes do CREATE POLICY
      const commentLines = [];
      for (let i = linesBefore.length - 1; i >= 0; i--) {
        if (linesBefore[i].trim().startsWith('--')) {
          commentLines.unshift(linesBefore[i]);
        } else if (linesBefore[i].trim() === '') {
          continue;
        } else {
          break;
        }
      }
      
      // Encontrar início da linha do CREATE POLICY para pegar indentação correta
      const createPolicyLineStart = beforeMatch.lastIndexOf('\n') + 1;
      const createPolicyLine = content.substring(createPolicyLineStart, matchIndex + match[0].indexOf('ON'));
      const correctIndent = createPolicyLine.match(/^(\s*)/)?.[1] || '  ';
      
      // Inserir DROP POLICY IF EXISTS antes do CREATE, mantendo comentários
      const dropLine = `${correctIndent}DROP POLICY IF EXISTS ${policyName} ON ${tableName};`;
      
      // Inserir antes do CREATE POLICY, depois de comentários se houver
      let insertIndex = matchIndex;
      if (commentLines.length > 0) {
        // Inserir após o último comentário
        const lastCommentIndex = beforeMatch.lastIndexOf(commentLines[commentLines.length - 1]);
        insertIndex = lastCommentIndex + commentLines[commentLines.length - 1].length;
        // Verificar se há quebra de linha após o comentário
        if (content.substring(insertIndex, matchIndex).trim() !== '') {
          insertIndex = matchIndex; // Sem quebra de linha, inserir antes do CREATE
        } else {
          insertIndex += '\n'.length;
        }
      }
      
      content = content.substring(0, insertIndex) + 
                (insertIndex < matchIndex ? '' : '\n') + 
                dropLine + '\n' + 
                content.substring(matchIndex);
      
      changed = true;
      changes.push(`Added DROP POLICY IF EXISTS for ${policyName} on ${tableName}`);
    }
  });
  
  return {
    content: changed ? content : content,
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
