head.js(
  // External libraries
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

class CollData {
  entity_types = []
  relation_types = []
  event_types = []
}

class DocData {
  text = ''
  entities = []
  attributes = []
  relations = []
  triggers = []
  events = []
}

var collInput
var visualizationDivs = [
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
  $('#visualization').empty()
  try {
    var JSONNLP = JSON.parse(collInput.val())
    JSONNLP.documents.forEach((doc, index) => {
      $('#visualization').append(
        '<div class="card"><div id="document' + index + '" class="card-body"></div></div>'
      )
      $('#document' + index).append('<h5 class="card-title">Document ' + (index + 1) + '</h5>')

      visualizationDivs.forEach((viz) => {
        $('#document' + index).append('<h6>' + getStartCase(viz) + '</h6>')
        $('#document' + index).append('<div id="' + viz + index + '"></div>')
      })
      buildDocument(index, doc)
    })

    collInput.css({ outlineColor: 'black' })
  } catch (e) {
    console.info(e)
    collInput.css({ outlineColor: 'red' })
    return
  }
}

function buildDocument(index, document) {
  var tokens = document.tokenList
  buildPartOfSpeech(tokens, index)
}

function getStartCase(text) {
  var result = text.replace(/([A-Z])/g, ' $1')
  return result.charAt(0).toUpperCase() + result.slice(1)
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
  var output = ''
  tokens.forEach((token) => {
    output += token.text
    if (token.misc.SpaceAfter) {
      output += ' '
    }
  })
  return output
}

function buildPartOfSpeech(tokens, index) {
  var collData = new CollData()
  var docData = new DocData()
  docData.text = buildText(tokens)
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
  visualizationHandler('partOfSpeech' + index, collData, docData)
}

function visualizationHandler(elementID, collData, docData) {
  var collInput = $('#jsonnlp')
  var renderError = () => {
    collInput.css({ outlineColor: 'red' })
  }

  var dispatcher = Util.embed(
    elementID,
    $.extend({ collection: null }, collData),
    $.extend({}, docData),
    webFontURLs
  )
  dispatcher.on('renderError: Fatal', renderError)
}
