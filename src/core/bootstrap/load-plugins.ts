import { FSWatcher } from "alar";
import { Plugin } from '../tools/Plugin';

declare global {
    namespace app {
        namespace plugins {
            const name: string;
            const path: string;
            function resolve(path: string): string;
            function watch(): FSWatcher;
        }
    }
}

global["app"].plugins = new Plugin("app.plugins");