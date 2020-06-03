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
  entity_types: [
    {
      type: 'Person',
      labels: ['Person', 'Per'],
      bgColor: '#7fa2ff',
      borderColor: 'darken'
    }
  ],
  relation_types: [
    {
      type: 'Anaphora',
      labels: ['Anaphora', 'Ana'],
      dashArray: '3,3',
      color: 'purple',
      args: [
        {
          role: 'Anaphor',
          targets: ['Person']
        },
        {
          role: 'Entity',
          targets: ['Person']
        }
      ]
    }
  ],
  event_types: [
    {
      type: 'Assassination',
      labels: ['Assassination', 'Assas'],
      bgColor: 'lightgreen',
      borderColor: 'darken',
      arcs: [
        {
          type: 'Victim',
          labels: ['Victim', 'Vict']
        },
        {
          type: 'Perpetrator',
          labels: ['Perpetrator', 'Perp'],
          color: 'green'
        }
      ]
    }
  ]
}

var docData = {
  text: "Ed O'Kelley was the man who shot the man who shot Jesse James.",
  entities: [
    ['T1', 'Person', [[0, 11]]],
    ['T2', 'Person', [[20, 23]]],
    ['T3', 'Person', [[37, 40]]],
    ['T4', 'Person', [[50, 61]]]
  ],
  attributes: [['A1', 'T4']],
  relations: [
    [
      'R1',
      'Anaphora',
      [
        ['Anaphor', 'T2'],
        ['Entity', 'T1']
      ]
    ]
  ],
  triggers: [
    ['T5', 'Assassination', [[45, 49]]],
    ['T6', 'Assassination', [[28, 32]]]
  ],
  events: [
    [
      'E1',
      'T5',
      [
        ['Perpetrator', 'T3'],
        ['Victim', 'T4']
      ]
    ],
    [
      'E2',
      'T6',
      [
        ['Perpetrator', 'T2'],
        ['Victim', 'T3']
      ]
    ]
  ]
}

head.ready(() => {
  var collInput = $('#jsonnlp')
  collInput.html('{"asdf": "asdf"}')

  var liveDispatcher = Util.embed(
    'partOfSpeech',
    $.extend({ collection: null }, collData),
    $.extend({}, docData),
    webFontURLs
  )

  var renderError = () => {
    collInput.css({ border: '2px solid red' })
  }

  liveDispatcher.on('renderError: Fatal', renderError)

  var collInputHandler = () => {
    var collJSON
    try {
      collJSON = collData
      var jkl = JSON.parse(collInput.val())
      console.info('asdf')
      collInput.css({ outlineColor: 'black' })
    } catch (e) {
      collInput.css({ outlineColor: 'red' })
      return
    }

    try {
      liveDispatcher.post('collectionLoaded', [$.extend({ collection: null }, collJSON)])
    } catch (e) {
      console.error('collectionLoaded went down with:', e)
      collInput.css({ outlineColor: 'red' })
    }
  }

  var listenTo = 'input'
  collInput.bind(listenTo, collInputHandler)
})
