import fs from 'fs'
import path from 'path'
import processJSON from '../index.js'
import yaml from 'js-yaml'

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
  test("Process and include text file", ()=>{
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

    jsonProcessed = processJSON(dataDir, 'textInclude.json',
                                    {
                                      "types": {
                                        ".txt": procText
                                      }
                                    }
                                  )

      expect(jsonProcessed).toEqual(expectedTextIncludeJSON)
    })

    test("Process and include yaml file", ()=>{
    function procYaml(text) {
      return yaml.safeLoad(text) // , {schema: 'JSON_SCHEMA'})
              // for instance...
    }
    let expectedYamlIncludeBuf = fs.readFileSync(dataDir + 'expectedYamlInclude.json', 'utf8')
    let expectedYamlIncludeJSON = JSON.parse(expectedYamlIncludeBuf)

    jsonProcessed = processJSON(dataDir, 'yamlInclude.json',
                                  {
                                    "types": {
                                      ".yml": procYaml
                                    }
                                  }
                                )

    expect(jsonProcessed).toEqual(expectedYamlIncludeJSON)
  })
})

describe ("Errors", ()=> {
  let errDir = dataDir + 'errors' + path.sep

  test("throws on-existent entry file", ()=> {
    expect(()=> {
      processJSON(dataDir, 'bad_file.json')
    }).toThrow(/^json-processor: Can't read file, doesn't exist:/)
  })


  test("throws on bad json in entry file", ()=> {
    expect(()=> {
      processJSON(errDir, 'bad_json.json')
    }).toThrow()
  })

  test("throws on bad data in include file", ()=> {
    expect(()=> {
      processJSON(errDir, 'bad_data_in_include.json')
    }).toThrow()
  })

  test("throws on unrecognized file type", ()=> {
    expect(()=> {
      processJSON(dataDir, 'errors/unrecognized_file_type.json')
    }).toThrow(/^json-processor: Unrecognized file type:/)
  })

  test("throws on substitution path not found (no options)", ()=> {
    expect(()=> {
      processJSON(dataDir, "errors/substitution_path_not_found.json")
    }).toThrow(/^json-processor: no substitution path for fn:/)
  })

  test("throws on substitution path not found (with options)", ()=> {
    expect(()=> {
      processJSON(dataDir, "errors/substitution_path_not_found.json",
                  {
                    paths: {}
                  })
    }).toThrow(/^json-processor: no substitution path for fn:/)
  })

  test("throws on included file not found", ()=> {
    expect(()=> {
      processJSON(dataDir, "errors/included_file_not_found.json")
    }).toThrow(/^json-processor: included file not found:/)
  })
})