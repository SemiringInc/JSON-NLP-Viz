head.js(
  // External libraries
  'script/jquery.min.js',
  'script/jquery.svg.min.js',
  'script/jquery.svgdom.min.js',

  // brat helper modules
  'script/configuration.js',
  'script/util.js',
  'script/annotation_log.js',
  'script/webfont.js',

  // brat modules
  'script/dispatcher.js',
  'script/url_monitor.js',
  'script/visualizer.js'
)

var ready = false

var webFontURLs = [
  'fonts/Astloch-Bold.ttf',
  'fonts/PT_Sans-Caption-Web-Regular.ttf',
  'fonts/Liberation_Sans-Regular.ttf'
]

var collData = {
  entity_types: [],
  relation_types: [],
  event_types: []
}

var docData = {
  text: '',
  entities: [],
  attributes: [],
  relations: [],
  triggers: [],
  events: []
}

var collInput
var elements = [
  'partOfSpeech',
  'lemmas',
  'entityRecognition',
  'constituencyParse',
  'dependencies',
  'coreference',
  'sentiment'
]

head.ready(() => {
  var collInput = $('#jsonnlp')
  collInput.html(data)
  inputHandler()

  collInput.bind('input', inputHandler)
})

function inputHandler() {
  var collInput = $('#jsonnlp')
  try {
    var JSONNLP = JSON.parse(collInput.val())
    var tokens = JSONNLP.documents[0].tokenList
    buildText(tokens)
    buildXpos(tokens)

    collInput.css({ outlineColor: 'black' })
  } catch (e) {
    console.info(e)
    collInput.css({ outlineColor: 'red' })
    return
  }

  visualizationHandler('partOfSpeech')
}

function getRandomColor() {
  var letters = '89ABCDEF'.split('')
  var color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * letters.length)]
  }
  return color
}

function buildText(tokens) {
  docData.text = ''
  tokens.forEach((token) => {
    docData.text += token.text
    if (token.misc.SpaceAfter) {
      docData.text += ' '
    }
  })
}

function buildXpos(tokens) {
  var entitySet = new Set()
  tokens.forEach((token) => {
    entitySet.add(token.xpos)
    var entity = [
      token.id.toString(),
      token.xpos,
      [[token.characterOffsetBegin, token.characterOffsetEnd]]
    ]
    docData.entities.push(entity)
  })

  entitySet.forEach((entity) => {
    var entityType = {
      type: entity,
      labels: [entity],
      bgColor: '.,:;'.includes(entity) ? '#d3d3d3' : getRandomColor(),
      borderColor: 'darken'
    }
    collData.entity_types.push(entityType)
  })
}

function visualizationHandler(elementID) {
  var renderError = () => {
    collInput.css({ border: '2px solid red' })
  }

  var element = $('#' + elementID)
  element.empty()
  element.removeAttr('style')
  element.removeAttr('class')
  var dispatcher = Util.embed(
    elementID,
    $.extend({ collection: null }, collData),
    $.extend({}, docData),
    webFontURLs
  )
  dispatcher.on('renderError: Fatal', renderError)
}
