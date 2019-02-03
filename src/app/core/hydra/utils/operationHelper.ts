import { Machine } from '../entity/machine';
import { Operation, ComponentStatus, ToolStatus, ToolLoggedOn } from '../entity/operation';

export function getComponentStatus(operation: Operation, machine: Machine): ComponentStatus[] {
  const componentStatus = [];
  operation.bomItems.forEach(item => {
    const loggedOn = machine.componentsLoggedOn.find(c => c.material === item.material);
    if (loggedOn) {
      // Material Find
      componentStatus.push({
        material: item.material,
        pos: item.pos,
        isReady: true,
        batchName: loggedOn.batchName,
        quantity: loggedOn.batchQty,
      });
    } else {
      componentStatus.push({
        material: item.material,
        pos: item.pos,
        isReady: false
      });
    }
  });

  return componentStatus;
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

