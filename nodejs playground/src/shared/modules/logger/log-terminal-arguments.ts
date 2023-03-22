export function logTerminalArguments(operationsParams: Record<string, any>): void {
  console.log('Operation params confirmed:');
  for (const param in Object.getOwnPropertyNames(operationsParams)) {
    console.log(param, operationsParams[param]);
  }
}