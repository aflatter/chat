require('chat/core');

var bind = Util.bind;

Chat.MessageView = SC.View.extend({
  readablePayload: function() {
    var payload = this.getPath('content.payload'),
        text    = '',
        user;

    payload.forEach(function(part) {
      if (typeof part == 'string') text += part;
      else text += " " + part.text;
    });

    return text;
  }.property('content').cacheable(),
  readableCreatedAt: function() {
    var createdAt = this.getPath('content.createdAt');
    return (new Date(createdAt)).strftime("%H:%M:%S");
  }.property('content').cacheable()
});

Chat.MessageFieldView = SC.View.extend({
  classNames: 'message-field-view'.w(),

  /* Controls whether the field currently is editable or not. */
  isEditable: YES,

  render: function(buffer) {
    this.applyEditable(buffer);
  },

  /*
   * Sets the contenteditable attribute to the right value and adds an builds
   * an observer to update the attribute when the isEditable property changes.
   */
  applyEditable: function(buffer) {
    var value = this.get('isEditable'),
        attr  = 'contenteditable';

    // Apply the initial value to the buffer.
    if (value) buffer.attr(attr, true);

    // Update attribute when property changes.
    this.addObserver('isEditable', function() {
      this.$().attr(attr, this.get('isEditable'));
    });
  },

  /* 
   * Catch ENTER and trigger processing.
   */
  keyPress: function(evt) {
    if (evt.keyCode == 13) {
      this.insertNewline(evt);
      return false;
    }
  },

  /*
   * Processes the user input and builds a payload out of it
   */
  insertNewline: function(evt) {
    var payload = [];

    this.$().contents().each(function(i, el) {
      el = $(el);

      // Text is directly pushed into the payload.
      if (el instanceof Text && el.data.length > 0) {
        return payload.push(el.data);
      }
      
      // Other elements are serialized.
      // Text is preserved in case the user disconnects.
      payload.push({
        id: Number(el.attr('data-id')),
        text: el.text(),
        type: 'user'
      });
    });

    this.set('payload', payload);

    Chat.statechart.sendAction('sendMessage', this, payload)

    return false;
  },

  /*
   * Sets up jQuery UI autocomplete 
   */
  didInsertElement: function() {
    this._super();

    this.$().autocomplete({
      source: bind(this, 'suggest'),
      select: bind(this, 'didSelectEntryFromMenu'),
      open:   bind(this, 'willOpenMenu'),
      close:  function() { return false },
      focus:  function() { return false },
      position: {my: 'left bottom', at: 'left top'}
    });
  },

  /*
   * Preserve the range to be able to restore the position of the cursor
   * after the menu closed
   */
  willOpenMenu: function() {
    this.set('range', window.getSelection().getRangeAt(0));
  },

  /*
   * Builds a representation of the user and inserts it after the cursor position
   * when a user has been chosen from the autocomplete menu.
   */
  didSelectEntryFromMenu: function(ctx, evt, entry) {
    var selection = window.getSelection(),
        range     = this.get('range'),
        itemHTML  = this.buildMarkupForMenuItem(entry.item),
        fragment  = range.createContextualFragment(itemHTML);
    
    // Select the @ that triggered auto-completion and delete it.
    range.setStart(range.startContainer, range.startOffset - 1);
    range.deleteContents();
    // Insert the selected item.
    range.insertNode(fragment);
    // Select all contents and collapse the range to the end offset.
    range.selectNodeContents(this.$()[0]);
    range.collapse(false);
    // Now clear all selections and add ours again.
    selection.removeAllRanges();
    selection.addRange(range);

    evt.preventDefault();
    evt.stopPropagation();
    return false;
  },

  /*
   * Create a HTML string representing the selected menu item.
   */
  buildMarkupForMenuItem: function(item) {
    var el = SC.RenderBuffer('span');

    el.attr('class', 'contact');
    el.attr('data-id', item.value);
    el.attr('contenteditable', false);
    el.push(item.label);

    return el.string();
  },

  /*
   * Suggests users based on the current content.
   */
  suggest: function(ctx, req, res) {
    var users   = this.get('users'),
        term    = req.term,
        length  = term.length,
        result  = [];

    if (term.charAt(length - 1) == '@') {
      users.forEach(function(e) {
        result.push({value: e.get('id'), label: e.get('name')});
      });
      res(result);
    } else {
      res(false);
    }
  }
});
