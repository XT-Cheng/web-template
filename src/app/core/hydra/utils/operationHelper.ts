import { Machine } from '../entity/machine';
import { Operation, ComponentStatus, ToolStatus, ToolLoggedOn, ComponentLoggedOn } from '../entity/operation';

export interface ComponentToBeLoggedOff {
  batchName: string;
  allowLogoff: boolean;
  material: string;
  batchQty: number;
  machine: string;
  operations: { name: string, pos: number }[];
}

export type ComponentToBeReplenish = ComponentLoggedOn;
export type ComponentToBeChangeQty = ComponentLoggedOn;

export function getComponentToBeReplenish(machine: Machine): ComponentLoggedOn[] {
  return machine.componentsLoggedOn;
}

export function getComponentToBeLoggedOff(machine: Machine): ComponentLoggedOn[] {
  return machine.componentsLoggedOn;
}

export function getToolStatus(operation: Operation, machine: Machine): ToolStatus[] {
  const toolStatus: ToolStatus[] = [];

  // operation.toolItems.forEach((toolItem, key) => {
  //   let loggedOnFound: ToolLoggedOn;
  //   toolItem.availableTools.some(available => {
  //     loggedOnFound = machine.toolsLoggedOn.find(loggedOn => {
  //       return loggedOn.toolName === available;
  //     });

  //     return loggedOnFound ? true : false;
  //   });

  //   if (loggedOnFound) {
  //     toolStatus.push({
  //       requiredMaterial: key,
  //       loggedOnMachine: loggedOnFound.loggedOnMachine,
  //       deputyOperation: loggedOnFound.loggedOnOperation,
  //       toolId: loggedOnFound.toolId,
  //       toolName: loggedOnFound.toolName,
  //       isReady: true,
  //     });
  //   } else {
  //     toolStatus.push({
  //       requiredMaterial: key,
  //       isReady: false,
  //     });
  //   }
  // });

  return toolStatus.sort((a) => a.isReady ? 1 : -1);
}

export function getComponentStatus(operation: Operation, machine: Machine): ComponentStatus[] {
  const componentStatus: ComponentStatus[] = [];
  // operation.bomItems.forEach(item => {
  //   const loggedOn = machine.componentsLoggedOn.find(c => c.material === item.material);
  //   if (loggedOn) {
  //     // Material Find
  //     componentStatus.push({
  //       operation: loggedOn.operation,
  //       material: item.material,
  //       pos: item.pos,
  //       isReady: true,
  //       batchName: loggedOn.batchName,
  //       quantity: loggedOn.batchQty,
  //     });
  //   } else {
  //     componentStatus.push({
  //       operation: ``,
  //       material: item.material,
  //       pos: item.pos,
  //       isReady: false
  //     });
  //   }
  // });
  return componentStatus;
}
