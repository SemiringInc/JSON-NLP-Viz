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
  'fonts/Astloch-Bold.ttf'
  // 'fonts/PT_Sans-Caption-Web-Regular.ttf'
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
  // collInput.html(data)
  // inputHandler()

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
        $('#document' + index).append('<h6 class="my-2">' + getStartCase(viz) + '</h6>')
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
  var relations = document.dependencyTrees.flatMap((dependency) => dependency.dependencies)
  var coreferences = document.coreferences
  var constituents = document.constituents
  var sentences = document.sentences
  var text = buildText(tokens)
  buildPartOfSpeech(tokens, index, text)
  buildLemmas(tokens, index, text)
  buildEntityRecognition(tokens, index, text)
  buildDependencies(tokens, relations, index, text)
  buildCoreferences(tokens, coreferences, index, text)
  buildConstituencyParse(constituents, index)
  buildSentiment(tokens, sentences, index, text)
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

function buildPartOfSpeech(tokens, index, text) {
  var collData = new CollData()
  var docData = new DocData()
  docData.text = text
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

function buildLemmas(tokens, index, text) {
  var collData = new CollData()
  var docData = new DocData()
  docData.text = text
  var entitySet = new Set()
  tokens.forEach((token) => {
    entitySet.add(token.lemma)
    var entity = [
      token.id.toString(),
      token.lemma,
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
  visualizationHandler('lemmas' + index, collData, docData)
}

function buildEntityRecognition(tokens, index, text) {
  var collData = new CollData()
  var docData = new DocData()
  docData.text = text
  var entitySet = new Set()
  var currentEntity = {
    id: undefined,
    entity: undefined,
    locationStart: undefined,
    locationEnd: undefined
  }
  tokens.forEach((token) => {
    if (token.hasOwnProperty('entity')) {
      entitySet.add(token.entity)

      if (!currentEntity.id) {
        currentEntity.id = token.id.toString()
        currentEntity.entity = token.entity
        currentEntity.locationStart = token.characterOffsetBegin
        currentEntity.locationEnd = token.characterOffsetEnd
      } else if (
        currentEntity.entity === token.entity &&
        currentEntity.locationEnd === token.characterOffsetBegin - 1
      ) {
        currentEntity.locationEnd = token.characterOffsetEnd
      } else {
        var entity = [
          currentEntity.id,
          currentEntity.entity,
          [[currentEntity.locationStart, currentEntity.locationEnd]]
        ]
        docData.entities.push(entity)
        currentEntity.id = token.id.toString()
        currentEntity.entity = token.entity
        currentEntity.locationStart = token.characterOffsetBegin
        currentEntity.locationEnd = token.characterOffsetEnd
      }

      var entity = [
        currentEntity.id,
        currentEntity.entity,
        [[currentEntity.locationStart, currentEntity.locationEnd]]
      ]
      docData.entities.push(entity)
    }
  })

  //TODO add entity combining if there are multiple of the same type in a row

  entitySet.forEach((entity) => {
    var entityType = {
      type: entity,
      labels: [entity],
      bgColor: '.,:;'.includes(entity) ? '#d3d3d3' : getRandomColor(),
      borderColor: 'darken'
    }
    collData.entity_types.push(entityType)
  })
  visualizationHandler('entityRecognition' + index, collData, docData)
}

function buildDependencies(tokens, relations, index, text) {
  var collData = new CollData()
  var docData = new DocData()
  docData.text = text
  var entitySet = new Set()
  tokens.forEach((token) => {
    entitySet.add(token.upos)
    var entity = [
      token.id.toString(),
      token.upos,
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
  relations.forEach((relation, index) => {
    var dependency = [
      index.toString(),
      relation.lab,
      [
        [relation.lab, relation.gov],
        [relation.lab, relation.dep]
      ]
    ]
    docData.relations.push(dependency)
  })
  visualizationHandler('dependencies' + index, collData, docData)
}

function buildCoreferences(tokens, references, index, text) {
  var collData = new CollData()
  var docData = new DocData()
  docData.text = text
  var entitySet = new Set()
  references.forEach((reference) => {
    entitySet.add('Referenced')
    var referenceTokens = reference.representative.tokens
    var firstToken = tokens.find((token) => token.id === referenceTokens[0])
    var lastToken = tokens.find((token) => token.id === referenceTokens[referenceTokens.length - 1])
    var entity = [
      reference.id.toString(),
      'Referenced',
      [[firstToken.characterOffsetBegin, lastToken.characterOffsetEnd]]
    ]
    docData.entities.push(entity)

    reference.referents.forEach((childReference, childIndex) => {
      entitySet.add('References')
      var referenceTokens = childReference.tokens
      var firstToken = tokens.find((token) => token.id === referenceTokens[0])
      var lastToken = tokens.find(
        (token) => token.id === referenceTokens[referenceTokens.length - 1]
      )
      var id = reference.id.toString() + childIndex
      var entity = [
        id,
        'References',
        [[firstToken.characterOffsetBegin, lastToken.characterOffsetEnd]]
      ]
      docData.entities.push(entity)
      var dependency = [
        id.toString(),
        'coref',
        [
          ['coref', id],
          ['coref', reference.id.toString()]
        ]
      ]
      docData.relations.push(dependency)
    })
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
  visualizationHandler('coreference' + index, collData, docData)
}

function buildConstituencyParse(constituents, index) {
  var term_font = 'sans-serif'
  var nonterm_font = 'sans-serif'
  var color = true
  var term_lines = true
  font_size = 16
  vert_space = 50
  hor_space = 10
  term_font = term_font + font_size + 'pt '
  nonterm_font = nonterm_font + font_size + 'pt '
  $('#constituencyParse' + index).empty()

  constituents.forEach((con, conIndex) => {
    var output = con.labeledBracketing.replace(/\(/g, '[').replace(/\)/g, ']')
    var id = 'csp' + index + ':' + conIndex
    var element = $('<div id="' + id + '"></div>')
    $('#constituencyParse' + index).append(element)
    element.append('<p>Sentence ' + (conIndex + 1) + '</p>')
    var img = go(
      output,
      font_size,
      term_font,
      nonterm_font,
      vert_space,
      hor_space,
      color,
      term_lines
    )
    element.append(img)
  })
}

function buildSentiment(tokens, sentences, index, text) {
  var collData = new CollData()
  var docData = new DocData()
  docData.text = text
  var entitySet = new Set()
  for (const property in sentences) {
    const sentence = sentences[property]
    entitySet.add(sentence.sentiment)
    var entity = [
      sentence.id.toString(),
      sentence.sentiment,
      [
        [
          tokens.find((element) => element.id === sentence.tokenFrom).characterOffsetBegin,
          tokens.find((element) => element.id === sentence.tokenTo - 1).characterOffsetEnd
        ]
      ]
    ]
    docData.entities.push(entity)
  }

  entitySet.forEach((entity) => {
    var entityType = {
      type: entity,
      labels: [entity],
      bgColor: '.,:;'.includes(entity) ? '#d3d3d3' : getRandomColor(),
      borderColor: 'darken'
    }
    collData.entity_types.push(entityType)
  })
  visualizationHandler('sentiment' + index, collData, docData)
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
