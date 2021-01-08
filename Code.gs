/**
 * demo use of rottler in apps script
 */
 
 const demo = () =>  {
  // get the key for the weather api
  const apiKey = getApiKey()

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
    rate: 50,
    smooth: true,
    smoothMinimum: 0.1,
    synch: true,
    sleep: (ms) => {
      Utilities.sleep(ms)
    }
  })
  
  // this is the input data
  const rows = fiddler.getData().slice(0,10)
  /*
  // now we can use this rottler to control access to the api in various ways
  // 1. most tradition way would be this
  copy.setData (rows.map (row => {
    const wt = rot.waitTime()
    console.log(wt)
    Utilities.sleep(wt)
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
  console.log('start iterator')
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
  console.log('start array')

  copy.setData(
    Array.from(rot.rowIterator({ 
      rows, transformer: ({row})=> decorateRow({result: getWeather({row, apiKey}), row })
    }))
    .map(({transformation})=>transformation))
    .dumpValues()


  rot.reset()

  const rowTransformer = rot.rowIterator({ 
    rows, 
    transformer: ({row})=> decorateRow({result: getWeather({row, apiKey}), row })
  })

  // and decorate as we go
  const newTransformed = []
  for   (let {transformation} of rowTransformer) {
    newTransformed.push(transformation)
  }
  // write update values
  copy.setData(newTransformed).dumpValues()
   */
   // qottle version
   const qot = bmQottle.newQottle({
     rateLimitPeriod: 1000 * 60,
     rateLimited: true,
     rateLimitDelay: 100,
     rateLimitMax: 50,
     concurrent: 1
   }) 
   
   // add all the work to the queue then when it's all over, dump it
   return Promise.all (rows.map(row=>qot.add(({entry})=>{
     console.log(entry.waitTime)
     return decorateRow({result: getWeather({row, apiKey}), row })
   })))
   .then(results=>copy.setData(results.map(f=>f.result)).dumpValues())
   
   
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
