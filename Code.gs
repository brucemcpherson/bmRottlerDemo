/**
 * demo use of rottler in apps script
 */
 
 const demo = () =>  {
  // get the key for the weather api
  const apiKey = getApiKey()
  console.log(apiKey)
  // get the source data
  const fiddler = getFiddler ()
  
  // a fiddler to copy the changed data to
  const copy = bmPreFiddler.PreFiddler().getFiddler({
    id:fiddler.getSheet().getParent().getId(),
    sheetName: 'copy sheet',
    createIfMissing: true  
  })
  
  // set up rate limiting for the weather API
  // allow on 40 calls per minute, with at least 100ms betweene ach one
  const rot = bmRottler.newRottler({
    period: 1000 * 60,
    delay: 100,
    rate: 40,
    synch: true,
    sleep: (ms) => {
      console.log('sleeping',ms)
      Utilities.sleep(ms)
    }
  })
  
  // this is the input data
  const rows = fiddler.getData().slice(0,5)
  
  // now we can use this rottler to control access to the api in various ways
  // 1. most tradition way would be this
  copy.setData (rows.map (row => {
    console.log(rot.waitTime())
    Utilities.sleep(rot.waitTime())
    rot.use()
    return decorateRow({result: getWeather({row, apiKey}), row })
  })).dumpValues ()

  rot.reset()
  // 2. most tradition way would be this, but let rottle worry about waiting
  copy.setData (rows.map (row => {
    rot.rottle()
    return decorateRow({result: getWeather({row, apiKey}), row })
  })).dumpValues ()


  rot.reset()
  // 3. my favorite - use an iterator - it automatically implements rate limiting
  const rowIterator = rot.rowIterator({ rows });
  // and decorate as we go
  const newData = []
  for   (let {row} of rowIterator) {
  newData.push(decorateRow({result: getWeather({row, apiKey}), row }))
  }
  // write update values
  copy.setData(newData).dumpValues()
  
  rot.reset()
  // 4. see if you can figure this one out
  copy.setData(Array.from(rot.rowIterator({ rows, transformer: ({row})=> decorateRow({result: getWeather({row, apiKey}), row })})).map(({transformation})=>transformation)).dumpValues()


   
   
 }
 
 // get from api
 const getWeather = ({row, apiKey}) => 
  JSON.parse(UrlFetchApp.fetch (`https://api.openweathermap.org/data/2.5/weather?lat=${row.latitude_deg}&lon=${row.longitude_deg}&appid=${apiKey}`).getContentText())
 
 // decorate the spreadsheet data with data from the api
 const decorateRow = ({result, row}) => {
    const {weather, main, dt} = result;
    return {
      ...row,
      description: weather[0].description,
      temp:  main.temp,
      humidity: main.humidity,
      timestamp: dt * 1000
    }
  }
  
 const getFiddler = () => {
   // get the fiddker for the demo sheet
   return bmPreFiddler.PreFiddler().getFiddler({ id: '1h9IGIShgVBVUrUjjawk5MaCEQte_7t32XeEP1Z5jXKQ', sheetName: 'airport list'})
 }
 
 const getApiKey = () => {
   return PropertiesService.getScriptProperties().getProperty("weatherKey")
 }
