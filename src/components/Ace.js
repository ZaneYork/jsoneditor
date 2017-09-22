// @flow

import { createElement as h, Component } from 'react'
import ace from '../assets/ace'

/**
 * Usage:
 *
 *     <Ace value={"{}"}
 *          ace={Object}
 *          indentation={2}
 *          onChange={function(value: String)}
 *          onLoadAce={function(aceEditor, container)} />
 *
 */
export default class Ace extends Component {
  aceEditor = null
  settingValue = false // Used to prevent Ace from emitting onChange event whilst we're setting a value programmatically

  render () {
    return h('div', {ref: 'container',  className: 'jsoneditor-code'})
  }

  shouldComponentUpdate () {
    // always prevent rerendering, that would destroy the DOM of the Ace editor
    return false
  }

  componentDidMount () {
    const container = this.refs.container

    // use ace from bundle, and if not available
    // try to use from options or else from global
    const _ace = ace || this.props.ace || window['ace']

    let aceEditor = null
    if (_ace && _ace.edit) {
      // create ace editor
      aceEditor = _ace.edit(container)

      // bundle and load jsoneditor theme for ace editor
      require('../assets/ace/theme-jsoneditor')

      // configure ace editor
      aceEditor.$blockScrolling = Infinity
      aceEditor.setTheme('ace/theme/jsoneditor')
      aceEditor.setShowPrintMargin(false)
      aceEditor.setFontSize(13)
      aceEditor.getSession().setMode('ace/mode/json')
      aceEditor.getSession().setTabSize(this.props.indentation || 2)
      aceEditor.getSession().setUseSoftTabs(true)
      aceEditor.getSession().setUseWrapMode(true)
      aceEditor.commands.bindKey('Ctrl-L', null)    // disable Ctrl+L (is used by the browser to select the address bar)
      aceEditor.commands.bindKey('Command-L', null) // disable Ctrl+L (is used by the browser to select the address bar)
    }
    else {
      // ace is excluded from the bundle.
    }

    // allow changing the config or completely replacing aceEditor
    this.aceEditor = this.props.onLoadAce
        ? this.props.onLoadAce(aceEditor, container) || aceEditor
        : aceEditor

    // register onchange event
    if (this.aceEditor) {
      this.aceEditor.on('change', this.handleChange)
    }

    // set value, the text contents for the editor
    if (this.aceEditor) {
      this.aceEditor.setValue(this.props.value || '', -1)
    }
  }

  componentWillReceiveProps (nextProps: {value: string, indentation?: number}) {
    if (this.aceEditor && nextProps.value !== this.aceEditor.getValue()) {
      this.settingValue = true
      this.aceEditor.setValue(nextProps.value, -1)
      this.settingValue = false
    }

    if (this.aceEditor && nextProps.indentation != undefined) {
      this.aceEditor.getSession().setTabSize(this.props.indentation)
    }

    // TODO: only resize only when needed
    setTimeout(() => {
      if (this.aceEditor) {
        this.aceEditor.resize(false);
      }
    }, 0)
  }

  componentWillUnmount () {
    // neatly destroy ace editor instance
    if (this.aceEditor) {
      this.aceEditor.destroy()
      this.aceEditor = null
    }
  }

  handleChange = () => {
    if (this.props && this.props.onChange && this.aceEditor && !this.settingValue) {
      // TODO: pass a diff
      this.props.onChange(this.aceEditor.getValue())
    }
  }
}