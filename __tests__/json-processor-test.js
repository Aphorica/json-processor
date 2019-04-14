import fs from 'fs'
import path from 'path'
import processJSON from '../index.js'

let dataDir = '__tests__' + path.sep + 'data' + path.sep

let jsonInBuf = fs.readFileSync(dataDir + 'basic.json')
let jsonIn = JSON.parse(jsonInBuf)
let jsonProcessed = null

describe ("Basic read test", () => {
  test ("Read JSON file", () => {
    jsonProcessed = processJSON(dataDir + 'basic.json')
    expect(jsonProcessed).toEqual(jsonIn)
  })

  test ("With startPath provided", ()=>{
    jsonProcessed = processJSON(dataDir, 'basic.json')
    expect(jsonProcessed).toEqual(jsonIn)
  })
})

describe ("Comments", () => {
  test ("Default comment prefix (!!)", ()=>{
    jsonProcessed = processJSON(dataDir, 'default_comments.json')
    expect(jsonProcessed).toEqual(jsonIn)    
  })

  test ("Custom comment prefix (##)", ()=>{
    jsonProcessed = processJSON(dataDir, 'custom_comments.json',
                                    {'comment-prefix': '##'})
    expect(jsonProcessed).toEqual(jsonIn) 
  })

  test ("Comments with children objects", ()=>{
    jsonProcessed = processJSON(dataDir, 'comments_with_children.json')
    expect(jsonProcessed).toEqual(jsonIn)   
  })
})

describe ("With file inclusions + comments", ()=> {
  let configDir = dataDir + 'config' + path.sep
  let expectedBuf = fs.readFileSync(configDir + 'expected.json')
  let expected = JSON.parse(expectedBuf)

  test("Subconfig in subdir", () => {
    jsonProcessed = processJSON(configDir, 'base_config.json', {
                                  paths: {
                                    subdir: configDir + 'sub_config_dir'
                                  }
                                })

    expect(jsonProcessed).toEqual(expected)
  })
})