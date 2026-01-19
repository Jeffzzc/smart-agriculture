export function createState() {
  return {
    sensors: new Map(),
    valves: new Map(),
    strategy: null,
    devices: null,
    autoJobs: new Map(),
    pendingCommands: new Map()
  }
}

