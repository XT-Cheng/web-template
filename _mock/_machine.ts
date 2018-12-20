import { MockRequest } from '@delon/mock';
import { Machine, Operation, BomItem } from '@core/hydra/interface/machine.interface';

const now = new Date();

function getMachine(params: any) {
  if (params.noOperation) {
    return getMachineWithoutOperation();
  }

  return getMachineWithOperation();
}

function getMachineWithOperation() {
  const data = new Machine();

  data.name = 'WeiChai Assembly Line';
  data.currentStatusNr = 310;
  data.currentStatus = `设备维修`;
  data.currentLeadOrder = '200218137836';
  data.nextLeadOrder = ``;
  data.currentShift = 1;

  data.alarmSetting = {
    oeeLower: 55,
    oeeUpper: 85,
    scrapLower: 5.5,
    scrapUpper: 8,
  };

  for (let i = 0; i < 5; i++) {
    const nextOP = Object.assign(new Operation(), {
      name: `200218137807000${i}0010`,
      targetQty: Math.floor(Math.random() * 1000),
      targetCycleTime: Math.floor(Math.random() * 1000),
      leadOrder: `20028888888888880010`,
      scheduleCompleted: new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)),
    });
    data.nextOperations.push(nextOP);
  }

  data.currentOperation = Object.assign(new Operation(), {
    name: '2002181378070010',
    targetQty: 1000,
    totalYield: 450,
    totalScrap: 12,
    targetCycleTime: 1800,
    scheduleCompleted: new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)),
  });

  data.currentOperation.bomItems.set(0, {
    material: '5-6100000-5',
    pos: 0,
    quantity: 1,
    unit: 'm'
  });

  data.currentOperation.bomItems.set(1, {
    material: '5-6100000-9',
    pos: 1,
    quantity: 2,
    unit: 'm'
  });

  data.currentOperation.bomItems.set(2, {
    material: '5-6100000-2',
    pos: 2,
    quantity: 2,
    unit: 'PC'
  });

  data.nextOperation = '200218137808';

  data.currentShiftOEE.availability = 99;
  data.currentShiftOEE.performance = 99;
  data.currentShiftOEE.quality = 99;

  data.componentLoggedOn.set(0, {
    batchName: '3SH53D22001044',
    batchQty: 900,
    bomItem: 0,
    material: '5-6100000-5'
  });

  data.componentLoggedOn.set(1, {
    batchName: '3SH53D22001045',
    batchQty: 8800,
    bomItem: 1,
    material: '5-6100000-9'
  });

  data.toolLoggedOn.set('XT_TEST_LPZ_1_0', {
    toolName: 'XT_TEST_LPZ_1_0',
    requiredTool: 'XT_TEST_LPZ_1'
  });

  data.toolLoggedOn.set('XT_TEST_LPZ_2_0', {
    toolName: 'XT_TEST_LPZ_2_0',
    requiredTool: 'XT_TEST_LPZ_2'
  });

  data.operatorLoggedOn.set(86812, {
    personNumber: 86812,
    name: `XT Cheng`,
    badgeId: `20120821`
  });

  const interval = 1000 * 60 * 30;

  const beginDay = (new Date(now.getTime() - (now.getTime() % interval))).getTime();

  for (let i = 0; i < 48; i += 1) {
    data.machineYieldAndScrap.set(new Date(beginDay - 1000 * 60 * 30 * i), {
      yield: Math.floor(Math.random() * 1000),
      scrap: Math.floor(Math.random() * 10),
      performance: Math.floor(Math.random() * 100),
    });
  }

  data.caculate();

  return data;
}

function getMachineWithoutOperation() {
  const data = new Machine();

  data.name = 'WeiChai Assembly Line';
  data.currentStatusNr = 310;
  data.currentStatus = `设备维修`;
  data.currentLeadOrder = '';
  data.nextLeadOrder = ``;
  data.currentShift = 1;

  data.alarmSetting = {
    oeeLower: 55,
    oeeUpper: 85,
    scrapLower: 5.5,
    scrapUpper: 8,
  };

  data.currentOperation = null;

  data.nextOperation = null;

  data.currentShiftOEE = null;

  data.caculate();

  return data;
}

export const MACHINE = {
  '/machine': (req: MockRequest) => getMachine(req.queryString)
};
