import mongoose from 'mongoose';

type MongoInit = {
  url: string,
  base: string,
  user: string,
  pass: string
}

type ModelMap = Map<string, mongoose.Model<any, any, any, any>>

type FindFun = (modelKey: string, obj: {
  searchData: {[key: string]: any},
  pageSize?: number
}) => Promise<{
  success: boolean
  message: string
  data?: {[key: string]: any}[]
}>

type SaveFun = (modelKey: string, data: {[key: string]: any}) => Promise<{
  success: boolean
  message: string
}>

type DeleteFun = (modelKey: string, data: {[key: string]: any}) => Promise<{
  success: boolean
  message: string
}>

class MongoDb {

  constructor(props: MongoInit) {
    this.init(props);
  }

  dbnet: mongoose.Connection
  modelMap: ModelMap = new Map()

  init(props: MongoInit) {
    const { url, base, user, pass } = props;
    const connectOption = {
      user,
      pass,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
    mongoose.connect(`${url}/${base}`, connectOption)
    this.dbnet = mongoose.connection;

    this.dbnet.once('open', function(e) {
      console.log('\x1B[35m', 'mongoDB connect success')
    })

    this.dbnet.on('error', function(e) {
      console.log('\x1B[35m', e);
    })
  }

  register(modelKey, schemaObj) { // 注册模型
    const schema = new mongoose.Schema(schemaObj)
    const model = this.dbnet.model(modelKey, schema);
    this.modelMap.set(modelKey, model);
  }

  find: FindFun = function(modelKey, {
    searchData,
    pageSize = 10
  }) {
    const db = this.modelMap.get(modelKey);
    return new Promise(resolve => {
      if (!db) {
        resolve({
          success: false,
          message: `未定义${modelKey}模型`
        });
      } else {
        db.find(searchData).limit(pageSize).exec((err, result) => {
          if (err) {
            resolve({
              success: false,
              message: err
            })
          } else {
            resolve({
              success: true,
              data: result,
              message: 'success'
            })
          }
        })
      }
    })
  }

  save: SaveFun = function(modelKey, data) {
    const db = this.modelMap.get(modelKey);
    return new Promise(resolve => {
      if (!db) {
        resolve({
          success: false,
          message: `未定义${modelKey}模型`
        });
      } else {
        new db(data).save().then(res => {
          resolve({
            success: true,
            message: res
          })
        }).catch(e => {
          resolve({
            success: false,
            message: e
          });
        });
      }
    })
  }

  deleteOne: DeleteFun = function(modelKey, data) {
    const db = this.modelMap.get(modelKey);
    return new Promise(resolve => {
      if (!db) {
        resolve({
          success: false,
          message: `未定义${modelKey}模型`
        });
      } else {
        db.deleteOne(data, function(err) {
          if (err) {
            resolve({
              success: false,
              message: err
            });
          } else {
            resolve({
              success: true,
              message: '删除成功'
            })
          }
        })
      }
    })
  }

  deleteMany: DeleteFun = function(modelKey, data) {
    const db = this.modelMap.get(modelKey);
    return new Promise(resolve => {
      if (!db) {
        resolve({
          success: false,
          message: `未定义${modelKey}模型`
        });
      } else {
        db.deleteMany(data, function(err) {
          if (err) {
            resolve({
              success: false,
              message: err
            });
          } else {
            resolve({
              success: true,
              message: '删除成功'
            })
          }
        })
      }
    })
  }

}

export default MongoDb;