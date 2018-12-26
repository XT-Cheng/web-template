import { MockRequest } from '@delon/mock';
import { Machine } from '@core/hydra/entity/machine';
import { Operation } from '@core/hydra/entity/operation';
import { toNumber } from '@delon/util';

const now = new Date();

function getMachine(params: any) {
  if (params.noOperation) {
    return getMachineWithoutOperation();
  }

  return getMachineWithOperation();
}

function setupOutput(operation: Operation) {
  const interval = 1000 * 60 * 30;

  const beginDay = (new Date(now.getTime() - (now.getTime() % interval))).getTime();

  for (let i = 47; i >= 0; i -= 1) {
    operation.output.set(new Date(beginDay - interval * i), {
      yield: Math.floor(Math.random() * 40),
      scrap: Math.floor(Math.random() * 3),
      performance: Math.floor(Math.random() * 100),
    });
  }
}

function setupMachineOutput(machine: Machine) {
  const interval = 1000 * 60 * 30;

  const beginDay = (new Date(now.getTime() - (now.getTime() % interval))).getTime();

  for (let i = 47; i >= 0; i -= 1) {
    machine.output.set(new Date(beginDay - interval * i), {
      yield: Math.floor(Math.random() * 40),
      scrap: Math.floor(Math.random() * 3),
      performance: -1,
    });
  }
}

function setupCurrentShiftOutput(operation: Operation) {
  const good = Math.floor((Math.random() * 500));
  const bad1 = Math.floor((Math.random() * 5));
  const bad2 = Math.floor((Math.random() * 5));

  operation.currentShiftOutput.yield = good;
  operation.currentShiftOutput.scrap.set(1, {
    scrapCode: 1,
    scrapText: `断裂`,
    scrap: bad1,
  });
  operation.currentShiftOutput.scrap.set(1, {
    scrapCode: 2,
    scrapText: `报警不良`,
    scrap: bad2,
  });
}

function setupOperatorLoggedOn(operation: Operation) {
  operation.operatorLoggedOn.set(1, {
    personNumber: 1,
    name: `ChengXiaotian`,
    badgeId: '20120821',
  });

  operation.operatorLoggedOn.set(2, {
    personNumber: 2,
    name: `BerlinDong`,
    badgeId: '00999999',
  });
}

function setupBOM(operation: Operation) {
  const count = Math.floor((Math.random() * 5));

  for (let i = 0; i < count; i++) {
    const quantity = Math.floor((Math.random() * 5));
    const loaded = Math.floor((Math.random() * 2));
    const batchQty = Math.floor((Math.random() * 1000));

    operation.bomItems.set(i, {
      material: `5-6100000-${i}`,
      pos: i,
      quantity: quantity,
      unit: 'm'
    });

    if (loaded > 0) {
      operation.componentsLoggedOn.set(i, {
        batchName: `3STEST`,
        batchQty: batchQty,
        pos: i,
        material: `5-6100000-${i}`,
      });
    }
  }
}

function setupTool(operation: Operation) {
  const count = Math.floor((Math.random() * 5));

  for (let i = 0; i < count; i++) {
    const requiredTool = `Tool${i}`;
    const loaded = Math.floor((Math.random() * 2));
    const quantity = Math.floor((Math.random() * 5));

    operation.toolItems.set(requiredTool, {
      requiredTooL: requiredTool,
      requiredQty: quantity,
    });

    if (loaded > 0) {
      operation.toolLoggedOn.set(requiredTool, {
        toolName: `TOOL`,
        requiredTool: requiredTool,
      });
    }
  }
}

function getMachineWithOperation() {
  const machine = new Machine();

  machine.machineName = 'FG-00001';
  machine.description = 'WeiChai Assembly Line';
  machine.currentStatusNr = 310;
  machine.currentStatus = `设备维修`;
  machine.currentShift = 1;

  machine.alarmSetting.oeeLower = 55;
  machine.alarmSetting.oeeUpper = 85;
  machine.alarmSetting.scrapLower = 5.5;
  machine.alarmSetting.scrapUpper = 8;

  //#region Current Operations
  for (let i = 0; i < 2; i++) {
    const targetQty = Math.floor(Math.random() * 1000 + 500);
    const totalYield = Math.floor(Math.random() * 1000);
    const totalScrap = Math.floor(Math.random() * 20);
    const targetCycleTime = Math.floor(Math.random() * 1000);

    const op = Object.assign(new Operation(), {
      order: `20021813780${i}`,
      sequence: `0010`,
      leadOrder: `200218136666`,
      targetQty: targetQty,
      totalYield: totalYield,
      totalScrap: totalScrap,
      targetCycleTime: targetCycleTime,
    });

    op.earliestStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.earliestEnd = new Date(op.earliestStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.latestStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.latestEnd = new Date(op.latestStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.planStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.planEnd = new Date(op.planStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.scheduleStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.scheduleEnd = new Date(op.scheduleStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.lastLoggedOn = new Date(now.getTime() - (Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000));

    setupBOM(op);

    setupTool(op);

    setupOperatorLoggedOn(op);

    setupOutput(op);

    setupCurrentShiftOutput(op);

    machine.currentOperations.push(op);
  }

  //#endregion

  //#region Next Operations
  for (let i = 0; i < 5; i++) {
    const targetQty = Math.floor(Math.random() * 1000 + 500);
    const totalYield = Math.floor(Math.random() * 1000);
    const totalScrap = Math.floor(Math.random() * 20);
    const targetCycleTime = Math.floor(Math.random() * 1000);

    const op = Object.assign(new Operation(), {
      order: `20021813790${i}`,
      sequence: `0010`,
      targetQty: targetQty,
      totalYield: totalYield,
      totalScrap: totalScrap,
      targetCycleTime: targetCycleTime,
    });

    op.earliestStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.earliestEnd = new Date(op.earliestStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.latestStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.latestEnd = new Date(op.latestStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.planStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.planEnd = new Date(op.planStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.scheduleStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.scheduleEnd = new Date(op.scheduleStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.lastLoggedOn = new Date(now.getTime() - (Math.floor(Math.random()) * 24 * 60 * 60 * 1000));

    machine.nextOperations.push(op);
  }

  //#endregion

  //#region Current Shift OEE
  machine.currentShiftOEE.availability = 99;
  machine.currentShiftOEE.performance = 99;
  machine.currentShiftOEE.quality = 99;
  //#endregion

  //#region Setup Machine Output for 24 hours

  setupMachineOutput(machine);

  //#endregion

  //#region Current Shift Output
  machine.currentShiftOutput.yield = 420;
  machine.currentShiftOutput.scrap.set(1, {
    scrapCode: 1,
    scrapText: `断裂`,
    scrap: 2,
  });
  machine.currentShiftOutput.scrap.set(1, {
    scrapCode: 2,
    scrapText: `报警不良`,
    scrap: 4,
  });
  //#endregion

  return machine;
}

function getMachineWithoutOperation() {
  const data = new Machine();

  data.machineName = 'FG-00001';
  data.description = 'WeiChai Assembly Line';
  data.currentStatusNr = 310;
  data.currentStatus = `设备维修`;
  data.currentShift = 1;

  data.alarmSetting.oeeLower = 55;
  data.alarmSetting.oeeUpper = 85;
  data.alarmSetting.scrapLower = 5.5;
  data.alarmSetting.scrapUpper = 8;

  //#region Next Operations
  for (let i = 0; i < 5; i++) {
    const targetQty = Math.floor(Math.random() * 1000 + 500);
    const totalYield = Math.floor(Math.random() * 1000);
    const totalScrap = Math.floor(Math.random() * 20);
    const targetCycleTime = Math.floor(Math.random() * 1000);

    const op = Object.assign(new Operation(), {
      name: `20021813790${i}0010`,
      leadOrder: `200218136666`,
      targetQty: targetQty,
      totalYield: totalYield,
      totalScrap: totalScrap,
      targetCycleTime: targetCycleTime,
    });

    op.earliestStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.earliestEnd = new Date(op.earliestStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.latestStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.latestEnd = new Date(op.latestStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.planStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.planEnd = new Date(op.planStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.scheduleStart = new Date(now.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));
    op.scheduleEnd = new Date(op.scheduleStart.getTime() + (Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000));

    op.lastLoggedOn = new Date(now.getTime() + (Math.floor(Math.random()) * 24 * 60 * 60 * 1000));

    data.nextOperations.push(op);
  }
  //#endregion

  return data;
}

export const MACHINE = {
  '/machine': (req: MockRequest) => getMachine(req.queryString)
};
