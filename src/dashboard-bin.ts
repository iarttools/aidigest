#!/usr/bin/env node
import { startDashboard } from './dashboard.js';

const port = Number(process.argv[2] ?? 8090);
startDashboard({ port, open: true });

