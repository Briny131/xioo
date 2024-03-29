import { Cluster } from 'cluster';
import os from 'os';
import path from 'path';
import Helper from '../Helper';

import AgantSchedule from './Schedule';

import xiooData from './print';

class AgantManager {
  /** 全局运行的目录 */
  projectRoot: string = process.cwd();
  /** 动态读取文件的目录 */
  readRoot: string = process.env.READ_ENV === 'prod' ? this.projectRoot + '/package' : this.projectRoot + '/app';
  /** 子进程列表 */
  workers: any[] = [];
  /** 集群 */
  cluster: Cluster;
  /** 工具函数 */
  helper: Helper = new Helper();
  /** 启动核数 */
  startCpuLen: number = Math.ceil(os.cpus().length / 2);

  /** 已启动的worker数量 */
  cpuSum = 0;

  /** 定时任务管理 */
  schedule: AgantSchedule;

  constructor(cluster: Cluster) {
    // 制造声明文件
    this.makeTypes();
    console.bgMagenta('Agant启动！');
    this.cluster = cluster;
    this.errorReload();
    this.listenPrintData();
    // 设置cpu数量
    this.getCpuAmount();
    this.schedule = new AgantSchedule(this);
  }

  /** 获取cpu启动时数量 */
  getCpuAmount = () => {
    const ServerConfigSource = this.helper.getDirToFileSource(path.join(this.readRoot, './config'));
    const ServerConfig = new ServerConfigSource.server();
    if(ServerConfig.startCpuAmount) {
      this.startCpuLen = ServerConfig.startCpuAmount;
    }
  }

  /** 制造声明文件 */
  private makeTypes() {
    if(process.env.READ_ENV === 'prod') return;
    Helper.makeType('service', 'service');
    Helper.makeType('plugins', 'plugins', 'Plugin');
  }

  /** 移除worker */
  remove(pid) {
    const index = this.workers.findIndex(item => pid === item.pid);
    this.workers.splice(index, 1);
  }

  /** 新增worker */
  add(workerItem) {
    this.workers.push(workerItem);
    workerItem.worker.on('message', (msg) => {
      // 让指定的控制器都可以监听到消息
      this[msg.type].listen(msg.data);
    });
  }

  /** 发生错误重启 */
  errorReload() {
    this.cluster.on('exit', (worker, code, signal) => {
      this.remove(worker.process.pid);
      console.log('我发生了错误======>', code, signal);
      setTimeout(() => {
        const worker = this.cluster.fork();
        this.add({
          pid: worker.process.pid,
          worker
        });
      }, 5000);
    });
  }

  /** 服务启动输出 */
  listenPrintData() {
    this.cluster.on('listening', (worker, address) => {
      this.cpuSum++;
      console.log(
        `工作进程已连接到 ${address.port}`);
      if(this.cpuSum === this.startCpuLen) {
        console.cyan(`已启动 === ${this.cpuSum} === 个进程服务！！！`);
        console.cyan(xiooData);
        
        this.schedule.initSchedule();
        console.bgCyan('动态的定时任务将在一分钟后启动');
        const timeout = setTimeout(() => {
          this.schedule.initDynamicSchedule();
          console.log('动态的定时任务已启动');
          clearTimeout(timeout);
        }, 1000 * 60)
      }
    });
  }
}

export = AgantManager;