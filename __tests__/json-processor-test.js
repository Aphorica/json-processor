import fs from 'fs'
import path from 'path'
import processJSON from '../index.js'

let dataDir = '__tests__' + path.sep + 'data' + path.sep

let jsonInBuf = fs.readFileSync(dataDir + 'basic.json', 'utf8')
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

describe ("Configuration with file inclusions + comments", ()=> {
  let configDir = dataDir + 'config' + path.sep
  let expectedBuf = fs.readFileSync(configDir + 'expected.json', 'utf8')
  let expected = JSON.parse(expectedBuf)

  test("Subconfig in subdir", () => {
    jsonProcessed = processJSON(configDir, 'base_config.json', {
                                  paths: {
                                    subdir: 'sub_config_dir'
                                  }
                                })

    expect(jsonProcessed).toEqual(expected)
  })
})

describe ("Include other file types", ()=> {
  test.only("Process and include text file", ()=>{
    function procText(text) {
      let retObj = {}
      let items = text.split("\n"), parts, v, vtext

      for (let ix = 0; ix < items.length; ++ix) {
        parts = items[ix].split(':')
        vtext = parts[1].trim()
        v = Number.parseInt(vtext)
        if (isNaN(v))
          v = vtext
        retObj[parts[0].trim()] = v
      }

      return retObj
    }

    let expectedTextIncludeBuf = fs.readFileSync(dataDir + 'expectedTextInclude.json', 'utf8')
    let expectedTextIncludeJSON = JSON.parse(expectedTextIncludeBuf)

    debugger
    jsonProcessed = processJSON(dataDir, 'textInclude.json',
                                  {
                                    "types": {
                                      ".txt": procText
                                    }
                                  }
                                )

    expect(jsonProcessed).toEqual(expectedTextIncludeJSON)
  })
})