// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // SERVER_URL: `http://202.0.226.51:3000`,
  SERVER_URL: `http://localhost:14683`,
  PRINTER_SERVICE_URL: `http://localhost:11296`,
  CREATE_LT_URL: `http://202.0.226.51:8952/api/BatchSplit/CreateBatch`,
  GET_LT_URL: `http://202.0.226.51:8952/api/BatchSplit/CreateSerialNumber`,
  production: false,
  useHash: true,
  hmr: false,
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
