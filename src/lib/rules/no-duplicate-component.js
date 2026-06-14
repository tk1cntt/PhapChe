/**
 * ESLint Rule: no-duplicate-component
 * Warns when creating component with similar name to existing shared component
 * Suggests using existing shared component or choosing a more specific name
 *
 * @see https://eslint.org/docs/developer-guide/working-with-rules
 */

const path = require('path');
const fs = require('fs');

// Shared component names (from COMPONENT_REGISTRY.md)
const SHARED_COMPONENTS = new Set([
  // Atoms
  'Button', 'Input', 'Select', 'Checkbox', 'Radio', 'Textarea',
  'DatePicker', 'FileUpload', 'Badge', 'Avatar', 'Icon', 'Tooltip', 'Tag',
  // Molecules
  'StatCard', 'StatusBadge', 'SLABar', 'EmptyState', 'LoadingSkeleton',
  'Pagination', 'TimelineItem', 'TableCell', 'FormField',
  'SearchInput', 'FilterDropdown', 'ActionMenu',
  // Organisms
  'DataTable', 'AuditTimeline', 'RequestTable', 'UserTable', 'VaultFileTable',
  'FormRenderer', 'Modal', 'ConfirmDialog', 'FilterBar', 'DetailPanel',
  // Templates
  'AppLayout', 'AdminLayout', 'UserLayout', 'Sidebar', 'Header', 'Breadcrumb',
  'PageContainer', 'CardGrid',
]);

// Generic names to warn about
const GENERIC_NAMES = new Set([
  'Card', 'Table', 'Form', 'List', 'Item', 'Row', 'Cell',
  'Container', 'Wrapper', 'Layout', 'Panel', 'Box', 'Div',
  'Title', 'Label', 'Text', 'Content', 'Body', 'Footer', 'Header',
]);

// Suggestions for generic names
const GENERIC_SUGGESTIONS = {
  Card: ['StatCard', 'InfoCard', 'UserCard', 'RequestCard'],
  Table: ['DataTable', 'RequestTable', 'UserTable', 'VaultFileTable'],
  Form: ['RequestForm', 'IntakeForm', 'ProfileForm'],
  List: ['RequestList', 'ThreadList', 'FileList'],
  Item: ['TimelineItem', 'ListItem', 'MenuItem'],
  Row: ['TableRow', 'ListRow'],
  Cell: ['TableCell'],
  Container: ['PageContainer', 'CardContainer'],
  Wrapper: ['ModalWrapper', 'PanelWrapper'],
  Layout: ['AppLayout', 'AdminLayout', 'UserLayout'],
  Panel: ['DetailPanel', 'SidePanel'],
  Box: ['CardBox', 'InfoBox'],
  Title: ['PageTitle', 'SectionTitle'],
  Label: ['FormLabel', 'FieldLabel'],
};

/**
 * Count usages of a component across the codebase
 * @param {string} componentName - Name of component to count
 * @returns {number} Usage count, -1 if error
 */
function countComponentUsages(componentName) {
  const componentsDir = path.join(process.cwd(), 'src', 'components');

  if (!fs.existsSync(componentsDir)) {
    return -1;
  }

  let count = 0;
  const searchDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        searchDir(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.jsx')) {
        // Skip test files
        if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
          continue;
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Simple regex to find component usage
        const regex = new RegExp(`<${componentName}[\\s>]`, 'g');
        const matches = content.match(regex);
        if (matches) {
          count += matches.length;
        }
      }
    }
  };

  try {
    searchDir(componentsDir);
  } catch {
    return -1;
  }

  return count;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn on duplicate or generic component names',
      recommended: true,
      url: 'https://docs.example.com/eslint-rules/no-duplicate-component',
    },
    schema: [],
    messages: {
      duplicateComponent:
        'Creating "{{ name }}" component - similar to existing "{{ similar }}" in shared/ui/. Consider using shared component or choose a more specific name.',
      genericName:
        'Component "{{ name }}" has a generic name. Consider using a more specific name like "{{ suggestion }}".',
      unusedInShared:
        'Component "{{ name }}" used only in 1 place. Consider if this should be in shared/{{ folder }}/ instead.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    // Skip non-component files
    if (!filename.endsWith('.tsx') && !filename.endsWith('.jsx')) {
      return {};
    }

    // Get component name from filename (PascalCase)
    const filenameBase = path.basename(filename, path.extname(filename));
    const componentName = filenameBase;

    // Skip test files and stories
    if (
      componentName.includes('.test') ||
      componentName.includes('.spec') ||
      componentName.includes('.stories')
    ) {
      return {};
    }

    // Check for duplicate with shared components
    for (const shared of SHARED_COMPONENTS) {
      if (componentName.toLowerCase() === shared.toLowerCase()) {
        context.report({
          node: sourceCode.ast,
          messageId: 'duplicateComponent',
          data: { name: componentName, similar: shared },
        });
        return {};
      }
    }

    // Check for similar names (fuzzy match)
    for (const shared of SHARED_COMPONENTS) {
      // Check if the component name starts with a shared name
      if (
        componentName.startsWith(shared) &&
        componentName !== shared
      ) {
        context.report({
          node: sourceCode.ast,
          messageId: 'duplicateComponent',
          data: { name: componentName, similar: shared },
        });
        return {};
      }
    }

    // Check for generic names
    if (GENERIC_NAMES.has(componentName)) {
      const suggestions = GENERIC_SUGGESTIONS[componentName] || [];
      const suggestion = suggestions[0] || 'MoreSpecificName';

      context.report({
        node: sourceCode.ast,
        messageId: 'genericName',
        data: {
          name: componentName,
          suggestion: suggestion,
        },
      });
    }

    // Check if file is in shared/ and used in only one place
    const relativePath = path.relative(process.cwd(), filename);
    if (relativePath.includes('src/components/shared/')) {
      const usages = countComponentUsages(componentName);
      if (usages <= 1 && usages >= 0) {
        const folder =
          relativePath.includes('/ui/')
            ? 'ui'
            : relativePath.includes('/table/')
              ? 'table'
              : relativePath.includes('/timeline/')
                ? 'timeline'
                : relativePath.includes('/layout/')
                  ? 'layout'
                  : relativePath.includes('/forms/')
                    ? 'forms'
                    : 'shared';

        context.report({
          node: sourceCode.ast,
          messageId: 'unusedInShared',
          data: { name: componentName, folder },
        });
      }
    }

    return {};
  },
};
