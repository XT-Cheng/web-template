import { Machine } from '../entity/machine';
import { Operation, ComponentStatus, ToolStatus, ToolLoggedOn } from '../entity/operation';

export interface ComponentToBeLoggedOff {
  batchName: string;
  allowLogoff: boolean;
  material: string;
  batchQty: number;
  operations: { name: string, pos: number }[];
}

export type ComponentToBeReplenish = ComponentToBeLoggedOff;

export function getComponentToBeReplenish(machine: Machine): ComponentToBeLoggedOff[] {
  const componentToBeLoggedOff: ComponentToBeLoggedOff[] = [];
  machine.componentsLoggedOn.forEach(item => {
    const find = componentToBeLoggedOff.find(c => c.batchName === item.batchName);
    if (find) {
      find.operations.push({ name: item.operation, pos: item.pos });
      if (!item.allowLogoff) {
        find.allowLogoff = false;
      }
    } else {
      componentToBeLoggedOff.push({
        batchName: item.batchName,
        allowLogoff: item.allowLogoff,
        material: item.material,
        batchQty: item.batchQty,
        operations: [{ name: item.operation, pos: item.pos }]
      });
    }
  });
  return componentToBeLoggedOff;
}

export function getComponentToBeLoggedOff(machine: Machine): ComponentToBeLoggedOff[] {
  const componentToBeLoggedOff: ComponentToBeLoggedOff[] = [];
  machine.componentsLoggedOn.forEach(item => {
    const find = componentToBeLoggedOff.find(c => c.batchName === item.batchName);
    if (find) {
      find.operations.push({ name: item.operation, pos: item.pos });
      if (!item.allowLogoff) {
        find.allowLogoff = false;
      }
    } else {
      componentToBeLoggedOff.push({
        batchName: item.batchName,
        allowLogoff: item.allowLogoff,
        material: item.material,
        batchQty: item.batchQty,
        operations: [{ name: item.operation, pos: item.pos }]
      });
    }
  });
  return componentToBeLoggedOff;
}

export function getComponentStatus(operation: Operation, machine: Machine): ComponentStatus[] {
  const componentStatus: ComponentStatus[] = [];
  operation.bomItems.forEach(item => {
    const loggedOn = machine.componentsLoggedOn.find(c => c.material === item.material);
    if (loggedOn) {
      // Material Find
      componentStatus.push({
        operation: loggedOn.operation,
        material: item.material,
        pos: item.pos,
        isReady: true,
        batchName: loggedOn.batchName,
        quantity: loggedOn.batchQty,
      });
    } else {
      componentStatus.push({
        operation: ``,
        material: item.material,
        pos: item.pos,
        isReady: false
      });
    }
  });
  return componentStatus.sort((a, b) => a.isReady ? 1 : -1);
}

export function getToolStatus(operation: Operation, machine: Machine): ToolStatus[] {
  const toolStatus = [];

  operation.toolItems.forEach((toolItem, key) => {
    let loggedOnFound: ToolLoggedOn;
    toolItem.availableTools.some(available => {
      loggedOnFound = machine.toolsLoggedOn.find(loggedOn => {
        return loggedOn.toolName === available;
      });

      return loggedOnFound ? true : false;
    });

    if (loggedOnFound) {
      toolStatus.push({
        requiredMaterial: key,
        loggedOnMachine: loggedOnFound.loggedOnMachine,
        toolName: loggedOnFound.toolName,
        isReady: true,
      });
    } else {
      toolStatus.push({
        requiredMaterial: key,
        isReady: false,
      });
    }
  });

  return toolStatus;
}

