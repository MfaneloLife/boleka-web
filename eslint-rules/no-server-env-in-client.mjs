/**
 * E-BOLEKA security rule: prevent `serverEnv` (or wholesale access to the
 * env module) from leaking into client files.
 *
 * A "client file" is any file that begins with a `'use client'` directive.
 */
const ENV_MODULE_REGEX = /(?:^|[/\\])lib[/\\]env(?:\.(?:ts|tsx|js|jsx|mjs|cjs))?$/;

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing serverEnv (or the env module wholesale) into client files to prevent secret-key leaks.",
    },
    messages: {
      serverEnvInClient:
        "CRITICAL SECURITY RISK: 'serverEnv' cannot be imported into Client files. Move secret handling into a Server Action.",
      envModuleInClient:
        "CRITICAL SECURITY RISK: the env module exposes 'serverEnv' and cannot be imported wholesale into Client files. Import only 'clientEnv' by name.",
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const text = sourceCode.getText().replace(/^\uFEFF/, "");

    // Only enforce within client files.
    const isClientFile = /^\s*["']use client["']/.test(text);
    if (!isClientFile) {
      return {};
    }

    const isEnvModule = (value) =>
      typeof value === "string" && ENV_MODULE_REGEX.test(value);

    const report = (node, messageId) => context.report({ node, messageId });

    return {
      ImportDeclaration(node) {
        if (!isEnvModule(node.source && node.source.value)) return;
        for (const spec of node.specifiers) {
          if (
            spec.type === "ImportSpecifier" &&
            spec.imported &&
            spec.imported.name === "serverEnv"
          ) {
            report(spec, "serverEnvInClient");
          } else if (
            spec.type === "ImportNamespaceSpecifier" ||
            spec.type === "ImportDefaultSpecifier"
          ) {
            report(spec, "envModuleInClient");
          }
        }
      },

      ExportNamedDeclaration(node) {
        if (!node.source || !isEnvModule(node.source.value)) return;
        for (const spec of node.specifiers) {
          if (spec.type === "ExportSpecifier" && spec.local.name === "serverEnv") {
            report(spec, "serverEnvInClient");
          }
        }
      },

      ExportAllDeclaration(node) {
        if (isEnvModule(node.source && node.source.value)) {
          report(node, "envModuleInClient");
        }
      },

      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "require" &&
          node.arguments.length === 1 &&
          node.arguments[0].type === "Literal" &&
          isEnvModule(node.arguments[0].value)
        ) {
          report(node, "envModuleInClient");
        }
      },
    };
  },
};
