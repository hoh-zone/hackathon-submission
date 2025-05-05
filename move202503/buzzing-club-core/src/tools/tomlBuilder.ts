export const buildMoveToml = (packageName: string) => {
  const moveToml = `

[package]
name = "${packageName}"
edition = "2024.beta"

[dependencies]
Sui = { local = "../../../sui/crates/sui-framework/packages/sui-framework/" }
buzzing = { local = "../buzzing" }

[addresses]
${packageName} = "0x0"
`;

  return moveToml;
};
