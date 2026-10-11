module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let hasChanges = false;

  ['router', 'publicRouter'].forEach(routerName => {
    root
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: { name: routerName },
        }
      })
      .forEach((path) => {
        const args = path.node.arguments;
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (
            (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') &&
            arg.async
          ) {
            // Avoid double wrapping
            if (path.parentPath.node.type === 'CallExpression' && path.parentPath.node.callee.name === 'asyncHandler') {
               continue;
            }
            args[i] = j.callExpression(j.identifier('asyncHandler'), [arg]);
            hasChanges = true;
          }
        }
      });
  });

  if (hasChanges) {
    const importExists = root.find(j.ImportDeclaration, {
      source: { value: '../utils/asyncHandler.js' }
    }).length > 0;

    if (!importExists) {
      const firstImport = root.find(j.ImportDeclaration).at(0);
      const importDecl = j.importDeclaration(
        [j.importSpecifier(j.identifier('asyncHandler'))],
        j.literal('../utils/asyncHandler.js')
      );
      if (firstImport.length > 0) {
        firstImport.insertBefore(importDecl);
      } else {
        root.get().node.program.body.unshift(importDecl);
      }
    }
  }

  return root.toSource();
};
