import oracledb from 'oracledb';
import Query from './query';
import { Helper } from 'xioo';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

class Oracle extends Query {
  /** 是否自动转下划线 */
  underline: boolean;
  pool: oracledb.Pool;
  config: any;

  constructor({ launch, underline, ...config }) {
    super({ type: 'pg', underline });
    this.underline = underline;
    this.config = config;
    this.connect(config);
  }

  connect = async (config) => {
    const { host, port, database, user, password } = config;
    
    this.pool = await oracledb.createPool({
      user: user,
      password: password,
      connectString: `${host}:${port}/${database}`,
    })
    
    console.log(`oracle ${host}:${port}/${database} 已经连接了`);
  }

  getConnection = async () => {
    const { host, port, database, user, password } = this.config;
    return oracledb.getConnection({
      user: user,
      password: password,
      connectString: `${host}:${port}/${database}`,
    });
  }

  /** 查询 */
  query = async (sql, conn?: any) => {
    if(conn) {
      return this.execQuery(sql, conn);
    } else {
      const pool = await this.pool.getConnection();

      const res = await this.execQuery(sql, pool);

      return res;
    }
  }

  /** 执行查询 */
  execQuery = async (sql, client: oracledb.Connection) => {
    const res = await client.execute(sql);
    let rows = res.rows;
    if (Array.isArray(res.rows) && this.underline) {
      rows = Helper.toHump(res.rows);
    }
    await client.close();
    return rows;
  }
}

export default Oracle;