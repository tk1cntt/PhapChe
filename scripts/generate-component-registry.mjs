/**
 * Component Registry Generator
 * Scans src/components/ and generates COMPONENT_REGISTRY.md
 *
 * Usage: node scripts/generate-component-registry.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(ROOT, 'src', 'components');
const OUTPUT_FILE = path.join(COMPONENTS_DIR, 'COMPONENT_REGISTRY.md');

/**
 * Scan components directory recursively
 * @param {string} dir - Directory to scan
 * @param {string} relativePath - Relative path for display
 * @returns {Array} Array of component info objects
 */
function scanComponents(dir, relativePath = '') {
  const items = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return items;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      items.push(...scanComponents(
        path.join(dir, entry.name),
        path.join(relativePath, entry.name)
      ));
    } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.') && !entry.name.includes('.stories.')) {
      const componentName = entry.name.replace('.tsx', '');
      const filePath = path.join(relativePath, entry.name);
      const fullPath = path.join(dir, entry.name);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Extract props interface
      const propsMatch = content.match(/interface\s+(\w+Props)\s*{([^}]+)}/);
      const props = propsMatch ? propsMatch[1] : 'Props';

      // Extract purpose from JSDoc or comments
      const jsdocMatch = content.match(/\*\s*\n\s*([^*@]+)/);
      const purpose = jsdocMatch ? jsdocMatch[1].trim() : 'Component';

      items.push({
        name: componentName,
        file: filePath.replace(/\\/g, '/'),
        props,
        purpose: purpose.replace(/\s+/g, ' ').trim(),
      });
    }
  }

  return items;
}

/**
 * Categorize components by type and location
 * @param {Array} components - Array of component objects
 * @returns {Object} Categorized components
 */
function categorizeComponents(components) {
  const shared = components.filter(c => c.file.includes('/shared/'));
  const domain = components.filter(c => !c.file.includes('/shared/'));

  const sharedByLevel = {
    atoms: [],
    molecules: [],
    organisms: [],
    templates: [],
  };

  const atomComponents = [
    'Button', 'Input', 'Select', 'Checkbox', 'Radio', 'Textarea',
    'DatePicker', 'FileUpload', 'Badge', 'Avatar', 'Icon', 'Tooltip', 'Tag'
  ];

  const moleculeComponents = [
    'StatCard', 'StatusBadge', 'SLABar', 'EmptyState', 'LoadingSkeleton',
    'Pagination', 'TimelineItem', 'TableCell', 'FormField',
    'SearchInput', 'FilterDropdown', 'ActionMenu'
  ];

  const organismComponents = [
    'DataTable', 'AuditTimeline', 'RequestTable', 'UserTable', 'VaultFileTable',
    'FormRenderer', 'Modal', 'ConfirmDialog', 'FilterBar', 'DetailPanel'
  ];

  const templateComponents = [
    'AppLayout', 'AdminLayout', 'UserLayout', 'Sidebar', 'Header',
    'Breadcrumb', 'PageContainer', 'CardGrid'
  ];

  for (const comp of shared) {
    if (atomComponents.includes(comp.name)) {
      sharedByLevel.atoms.push(comp);
    } else if (moleculeComponents.includes(comp.name)) {
      sharedByLevel.molecules.push(comp);
    } else if (organismComponents.includes(comp.name)) {
      sharedByLevel.organisms.push(comp);
    } else if (templateComponents.includes(comp.name)) {
      sharedByLevel.templates.push(comp);
    } else if (comp.file.includes('/ui/')) {
      // Default unknown shared/ui to molecules
      sharedByLevel.molecules.push(comp);
    } else if (comp.file.includes('/table/')) {
      sharedByLevel.organisms.push(comp);
    } else if (comp.file.includes('/timeline/')) {
      sharedByLevel.organisms.push(comp);
    } else if (comp.file.includes('/layout/')) {
      sharedByLevel.templates.push(comp);
    } else if (comp.file.includes('/forms/')) {
      sharedByLevel.organisms.push(comp);
    } else {
      // Unknown - put in molecules
      sharedByLevel.molecules.push(comp);
    }
  }

  return { sharedByLevel, domain };
}

/**
 * Generate markdown table for component list
 * @param {Array} components - Array of component objects
 * @returns {string} Markdown table
 */
function generateTable(components) {
  if (components.length === 0) {
    return '| - | - | - | - |\n';
  }

  let md = '| Component | File | Props | Purpose |\n';
  md += '|-----------|------|-------|----------|\n';

  for (const comp of components) {
    md += `| ${comp.name} | \`${comp.file}\` | ${comp.props} | ${comp.purpose} |\n`;
  }

  return md;
}

/**
 * Generate complete markdown document
 * @param {Object} sharedByLevel - Categorized shared components
 * @param {Array} domain - Domain-specific components
 * @returns {string} Complete markdown document
 */
function generateMarkdown(sharedByLevel, domain) {
  const now = new Date().toISOString().split('T')[0];
  const totalComponents =
    sharedByLevel.atoms.length +
    sharedByLevel.molecules.length +
    sharedByLevel.organisms.length +
    sharedByLevel.templates.length +
    domain.length;

  let md = `# Component Registry

**Generated:** ${now}
**Last Updated:** ${now}
**Total Components:** ${totalComponents}

This document catalogs all shared and domain-specific components in the GitNexus Legal platform.

---

## Granular Components - SHARED

### Level 1: Atoms (Basic UI Primitives)

| Component | File | Props | Purpose |
|-----------|------|-------|----------|
${sharedByLevel.atoms.map(c => `| ${c.name} | \`${c.file}\` | ${c.props} | ${c.purpose} |`).join('\n')}

### Level 2: Molecules (Composited Components)

| Component | File | Props | Purpose |
|-----------|------|-------|----------|
${sharedByLevel.molecules.map(c => `| ${c.name} | \`${c.file}\` | ${c.props} | ${c.purpose} |`).join('\n')}

### Level 3: Organisms (Complex Components)

| Component | File | Props | Purpose |
|-----------|------|-------|----------|
${sharedByLevel.organisms.map(c => `| ${c.name} | \`${c.file}\` | ${c.props} | ${c.purpose} |`).join('\n')}

### Level 4: Templates (Layout Components)

| Component | File | Props | Purpose |
|-----------|------|-------|----------|
${sharedByLevel.templates.map(c => `| ${c.name} | \`${c.file}\` | ${c.props} | ${c.purpose} |`).join('\n')}

---

## Domain-Specific Components

| Component | File | Props | Purpose |
|-----------|------|-------|----------|
${domain.map(c => `| ${c.name} | \`${c.file}\` | ${c.props} | ${c.purpose} |`).join('\n')}

---

*Document: COMPONENT_REGISTRY.md*
*Part of: Phase 55 - Architecture Standards*
*Run \`node scripts/generate-component-registry.mjs\` to regenerate*
`;

  return md;
}

// Main execution
console.log('Scanning components...');
const components = scanComponents(COMPONENTS_DIR);
console.log(`Found ${components.length} components`);

const { sharedByLevel, domain } = categorizeComponents(components);
const markdown = generateMarkdown(sharedByLevel, domain);

fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
console.log(`Generated: ${OUTPUT_FILE}`);

// Print summary
console.log('\nSummary:');
console.log(`  Atoms: ${sharedByLevel.atoms.length}`);
console.log(`  Molecules: ${sharedByLevel.molecules.length}`);
console.log(`  Organisms: ${sharedByLevel.organisms.length}`);
console.log(`  Templates: ${sharedByLevel.templates.length}`);
console.log(`  Domain: ${domain.length}`);
console.log(`  Total: ${components.length}`);
