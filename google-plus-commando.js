/* NEW BSD LICENSE {{{
Copyright (c) 2011, anekos.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice,
       this list of conditions and the following disclaimer.
    2. Redistributions in binary form must reproduce the above copyright notice,
       this list of conditions and the following disclaimer in the documentation
       and/or other materials provided with the distribution.
    3. The names of the authors may not be used to endorse or promote products
       derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.


###################################################################################
# http://sourceforge.jp/projects/opensource/wiki/licenses%2Fnew_BSD_license       #
# に参考になる日本語訳がありますが、有効なのは上記英文となります。                #
###################################################################################

}}} */

// INFO {{{
let INFO =
<>
  <plugin name="GooglePlusCommando" version="1.10.0"
          href="http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/google-plus-commando.js"
          summary="The handy commands for Google+"
          lang="en-US"
          xmlns="http://vimperator.org/namespaces/liberator">
    <author email="anekos@snca.net">anekos</author>
    <license>New BSD License</license>
    <project name="Vimperator" minVersion="3.0"/>
    <p>Mappings for Google+</p>
    <p>require: feedSomeKeys_3.js and x-hint.js and _libly.js</p>
  </plugin>
</>;
// }}}

(function () {

  // Utils {{{

  function A (list)
    Array.slice(list);

  function click (elem) {
    if (!elem)
      throw GPCError('elem is undefined');
    buffer.followLink(elem, liberator.CURRENT_TAB);
  }

  function withCount (command) {
    return function (count) {
      if (count < 1)
        count = 1;
      for (let i = 0; i < count; i++)
        command();
    };
  }

  function GPCError (msg) {
    if (this instanceof GPCError) {
      this.toString = function () String(msg);
    } else {
      return new GPCError(msg);
    }
  }

  // }}}

  // Selector {{{

  const S = (function () {

    return {
      role: role,
      typePlusone: '[g\\:type="plusone"]',
      editable: '.editable',

      currentEntry: {
        root: '.a-f-oi-Ai',
        unfold: [
          role('button', '.a-b-f-i-gc-cf-Xb-h'),                // 発言の省略 (以前)
          role('button', '.a-b-f-i-gc-Sb-Xb-h'), // 発言の省略 (以降)
          role('button', '.a-b-f-i-p-gc-h')      // 投稿の省略
        ],
        menu: {
          mute: '.a-b-f-i-Fb-C.a-f-i-Ia-Fb-C'
        },
        menuButton: role('button', '.d-h.a-f-i-Ia-D-h.a-b-f-i-Ia-D-h'),
        cancel: role('button', '[id$=".cancel"]'),
        submit: role('button', '[id$=".post"]'),
      },
      post: {
        root: '.n-Ob',
        open: '.n-Nd',
        cancel: 'div.om[id$=".c"]',
        submit: role('button', '.d-s-r.tk3N6e-e.tk3N6e-e-qc.n-Ja-xg')
      },
      notification: '#gbi1',
      viewer: {
        root: '.zg',
        prev: '.vn.GE.AH',
        next: '.vn.GE.BH'
      },
      dialog: {
        root: '.va-Q',
      },
      frames: {
        notifications: 'iframe[src*="/_/notifications/"]'
      },
      closeButton: '.CH'
    };

    function role (name, prefix)
      ((prefix || '') + '[role="' + name + '"]');

  })();

  // }}}

  // Elements {{{

  const Elements = (function () {

    return {
      get doc() content.document,
      get currentEntry () MakeElement(Entry, Elements.doc.querySelector(S.currentEntry.root)),
      post: {
        // get editor () Elements.postForm.querySelector('.editable').parentNode,
        // Elements.postForm.querySelector('.editable').parentNode
        get root () Elements.doc.querySelector(S.post.root),
        get open () Elements.doc.querySelector(S.post.open),
        get cancel () Elements.post.root.querySelector(S.post.cancel),
        get submit () Elements.doc.querySelector(S.post.submit)
      },
      get notification () Elements.doc.querySelector(S.notification),
      get viewer () MakeElement(Viewer, Elements.doc.querySelector(S.viewer.root)),
      get dialog () MakeElement(Dialog, Elements.doc.querySelector(S.dialog.root)),

      frames: {
        get notifications () MakeElement(Notifications, Elements.doc.querySelector(S.frames.notifications))
      },

      get focusedEditor () {
        function hasIFrame (elem) {
          let iframe = elem.querySelector('iframe');
          return iframe && iframe.contentWindow === win;
        }

        function get1 () {
          function button (editor, name)
            editor.parentNode.querySelector(S.role('button', <>[id$=".{name}"]</>));

          let editors = A(doc.querySelectorAll('div[id$=".editor"]')).filter(hasIFrame);
          if (editors.length === 0)
            return;
          if (editors.length > 1)
            throw 'Two and more editors were found.';

          return {
            editor: #1=(editors[0]),
            button: {
              submit: button(#1#, 'post'),
              cancel: button(#1#, 'cancel')
            }
          };
        }

        function get2 () {
          function button (editor, index) {
            let result = editor.querySelectorAll('td > ' + S.role('button'))[index];
            if (result)
              return result;
            if (index === 1)
              return editor.querySelector('.om[id$=".c"]');
          }

          const indexes = {submit: 0, cancel: 1};

          let editors = A(doc.querySelectorAll('.n')).filter(hasIFrame);
          if (editors.length === 0)
            return;
          if (editors.length > 1)
            throw 'Two and more editors were found.';

          return {
            editor: #1=(editors[0]),
            button: {
              submit: button(#1#, 0),
              cancel: button(#1#, 1)
            }
          };
        }

        let doc = content.document;
        let win = document.commandDispatcher.focusedWindow;

        return get1() || get2();
      },

      /**
       * ノードをHTMLテキストに変換
       * @param {Node} aNode
       * @param {String} [aParentTag] 親ノードのタグ名
       * @param {String} [aIndent]    インデント文字列
       * @param {Number} [aIndex]     ノード番号(ol>li 時のみ使用)
       * @return {String}
       */
      node2txt: function (aNode, aParentTag, aIndent, aIndex) {
        var txt = "";
        switch (aNode.nodeType) {
        case Node.DOCUMENT_NODE: // 9
        case Node.DOCUMENT_FRAGMENT_NODE: // 11
          switch (aParentTag) {
          case "ol":
          case "ul":
          case "dl":
            aIndent = "&nbsp;&nbsp;";
            break;
          default:
            aIndent = "";
          }
          txt = nodelist2txt(aNode.childNodes, aParentTag, aIndent).join("");
          break;
        case Node.TEXT_NODE: // 3
          txt = aNode.nodeValue.replace(/\s+/g, " ");
          break;
        case Node.ELEMENT_NODE: // 1
          let localName = aNode.localName,
              children = aNode.childNodes;
          switch (localName) {
          case "ul":
          case "ol":
          case "dl":
            txt = "<br/>\n" + nodelist2txt(children, localName, aIndent + "&nbsp;&nbsp;").join("");
            break;
          case "li":
            txt = aIndent + (aParentTag == "ol" ? ("  " + (aIndex+1)).slice(-2) + ". " : " * ").replace(" ", "&nbsp;", "g") +
                  nodelist2txt(children, "li", aIndent).join("") +
                  "<br/>\n";
            break;
          case "dt":
            txt = aIndent + "<b>" + nodelist2txt(children, localName, aIndent) + "</b>:<br/>\n";
            break;
          case "dd":
            txt = aIndent + "&nbsp;&nbsp;" + nodelist2txt(children, localName, aIndent) + "<br/>\n";
            break;
          case "br":
            txt = "<br/>\n";
            break;
          case "img":
            txt = "<img src=" + aNode.src.quote() + " width=\"" + aNode.width + "\" height=\"" + aNode.height + "\"/>";
            break;
          case "p":
            txt = nodelist2txt(children, "p", "").join("") + "<br/>\n";
            break;
          case "a":
            if (aNode.hasAttribute("href") && aNode.href.indexOf("http") == 0) {
              txt = "<a href=" + aNode.href.quote() + (aNode.title ? " title=" + aNode.title.quote() : "") + ">" +
                    nodelist2txt(children, "a", "").join("") +
                    "</a>";
              break;
            }
          default:
            txt = '<' + localName + '>' +
                  nodelist2txt(children, localName, aIndent).join("") +
                  '</' + localName + '>';
          }
          break;
        }
        return txt;
      },
    };

    function MakeElement (constructor, root) {
      if (root && !/none/.test(util.computedStyle(root).display))
        return constructor(root);
    }

    function Entry (root) {
      let self = {
        get root () root,
        get permlink () [
          e
          for ([, e] in Iterator(A(root.querySelectorAll('a'))))
          if (!e.getAttribute('oid'))
        ][0],
        get unfold () {
          for (let [, sel] in Iterator(S.currentEntry.unfold)) {
            let result = root.querySelector(sel);
            if (result)
              return result;
          }
        },
        get buttons () A(self.plusone.parentNode.querySelectorAll(S.role('button'))),
        get commentButton () self.buttons[0],
        get commentEditor () let (e = root.querySelector(S.editable)) (e && e.parentNode),
        get comment() (self.commentEditor || self.commentButton),
        get plusone () root.querySelector(S.typePlusone),
        get share () self.buttons[1],
        menu: {
          get root () root.querySelector(S.role('menu')),
          get items () A(self.menu.root.querySelectorAll(S.role('menuitem'))),
          get mute () {
            let item1 = self.menu.items.slice(-2)[0];
            let item2 = self.menu.root.querySelector(S.role('menuitem', S.currentEntry.menu.mute));
            if (item1 === item2)
              return item1;
          }
        },
        get menuButton () root.querySelector(S.currentEntry.menuButton),
        get cancel () root.querySelector(S.currentEntry.cancel),
        get submit () root.querySelector(S.currentEntry.submit)
      };
      return self;
    }

    function Dialog (root) {
      function nButton (n) {
        let bs = self.buttons;
        if (bs.length === 2)
          return bs[n];
      }
      let self = {
        get buttons () A(root.querySelectorAll(S.role('button'))),
        get submit () nButton(0),
        get cancel () nButton(1)
      };
      return self;
    }

    function Viewer (root) {
      let self = {
        get cancel () root.querySelector(S.closeButton),
        get prev () root.querySelector(S.viewer.prev),
        get next () root.querySelector(S.viewer.next)
      };
      return self;
    }

    function Notifications (root) {
      let self = {
        get root () root,
        get visible () {
          let h = parseInt(root.style.height, 10) > 0;
          if (!h)
            return false;
          let nwc =  plugins.googlePlusCommando.element.frames.notifications.root.contentDocument.querySelector('#nw-content');
          return parseInt(util.computedStyle(nwc).height, 10) > 100;
        }
      };
      return self;
    }

    /**
     * NodeListの子をテキストにして配列で返す
     * @param {NodeList} aChildNoes
     * @param {String} aParentTag
     * @param {String} aIndent
     * @return {String[]}
     */
    function nodelist2txt (aChildNodes, aParentTag, aIndent) {
      var a = [], index = 0;
      for (let i = 0, len = aChildNodes.length, child; child = aChildNodes[i]; ++i){
        let txt = Elements.node2txt(child, aParentTag, aIndent, index);
        if (txt) {
          a.push(txt);
          ++index;
        }
      }
      return a;
    }

    return Elements;
  })();

  // }}}

  // Post Help {{{

  const PostHelp = {
    PanelID: 'google-plus-commando-help-panel',

    get panel () Elements.doc.querySelector('#' + PostHelp.PanelID),

    show: function () {
      function move (panel) {
        let contentHeight = document.getElementById('content').boxObject.height;
        let rect = Elements.focusedEditor.editor.getClientRects()[0];
        if (rect.top < (contentHeight / 2)) {
          panel.style.top = '';
          panel.style.bottom = '10px';
        } else {
          panel.style.top = '10px';
          panel.style.bottom = '';
        }
      }

      let doc = Elements.doc;
      let parent = doc.body;

      let exists = PostHelp.panel;
      if (exists) {
        move(exists);
        exists.style.display = 'block';
        return;
      }

      let panel  = doc.createElement('div');
      panel.setAttribute('id', PostHelp.PanelID);
      let (ps = panel.style) {
        ps.position = 'fixed';
        ps.left = '10px';
        ps.zIndex = 1000;
        ps.backgroundColor = 'white';
        ps.border = 'solid 1px grey';
      }
      panel.innerHTML = <>
        <table>
          <tr><th>入力</th>           <th>効果</th>                   <th>解説</th>                                 </tr>
          <tr><td>*TEXT*</td>         <td><b>TEXT</b></td>            <td>太字</td>                                 </tr>
          <tr><td>_TEXT_</td>         <td><i>TEXT</i></td>            <td>斜体</td>                                 </tr>
          <tr><td>-TEXT-</td>         <td><s>TEXT</s></td>            <td>打ち消し線</td>                           </tr>
          <tr><td>*-TEXT-*</td>       <td><b><s>TEXT</s></b></td>     <td>太字/打消。打消(-)は内側に書く</td>       </tr>
          <tr><td>-ねこ-</td>         <td>☓</td>                      <td>日本語の打消はダメ</td>                   </tr>
          <tr><td>-ね こ-</td>        <td><s>ね こ</s></td>           <td>英数字や半角スペースを入れたらOK</td>     </tr>
          <tr><td>-Aねこす-</td>      <td><s>Aあねこす</s></td>       <td>英数字を前後に入れても良い</td>           </tr>
        </table>
      </>;

      move(panel);
      parent.appendChild(panel);

      return;
    },

    hide: function () {
      let exists = PostHelp.panel;
      if (exists)
        exists.style.display = 'none';
    }
  };

  // }}}

  // Commands {{{

  const Commands = {
    moveEntry: function (next) {
      let [arrow, vim, dir] = next ? ['<Down>', 'j', 'next'] : ['<Up>', 'k', 'prev'];

      if (Elements.viewer)
        return click(Elements.viewer[dir]);

      let arrowTarget = (function () {
        let notifications = Elements.frames.notifications;
        if (notifications && notifications.visible)
          return notifications.root.contentDocument.body;

        let menus = A(Elements.doc.querySelectorAll(S.role('menu', '[tabindex="0"]')));
        if (menus.length === 1)
          return menus[0];
      })();

      plugins.feedSomeKeys_3.API.feed.apply(
        null,
        arrowTarget ? [arrow, ['keypress'], arrowTarget] : [vim, ['vkeypress'], Elements.doc]
      );
    },
    next: withCount(function () Commands.moveEntry(true)),
    prev: withCount(function () Commands.moveEntry(false)),
    comment: function() {
      let entry = Elements.currentEntry;
      click(entry.comment);
      PostHelp.show();
    },
    plusone: function() click(Elements.currentEntry.plusone),
    share: function() click(Elements.currentEntry.share),
    post: function() {
      buffer.scrollTop();
      click(Elements.post.open);
      PostHelp.show();
    },
    yank: function () {
      let e = Elements.currentEntry.permlink;
      if (!e)
        liberator.echoerr('Not found permlink');
      util.copyToClipboard(e.href);
      liberator.echo('Copy the permlink to clipboard: ' + e.href);
    },
    notification: function () {
      click(Elements.notification);
    },
    cancel: function () {
      for (let [, n] in Iterator(['dialog', 'viewer'])) {
        let e = Elements[n];
        if (e && e.cancel)
          return click(e.cancel);
      }

      if (Elements.frames.notifications.visible)
        return click(Elements.notification);

      click(Elements.doc.body);
    },
    submit: function () {
      if (liberator.focus)
        return;
      PostHelp.hide();
      click(Elements.focusedEditor.button.submit);
    },
    unfold: function () {
      click(Elements.currentEntry.unfold);
    },
    menu: function () {
      click(Elements.currentEntry.menuButton);
    },
    mute: function () {
      click(Elements.currentEntry.menu.mute);
    }
  };

  // }}}

  // Define mappiings {{{

  (function () {

    const MatchingUrls = RegExp('^https://plus\\.google\\.com/*');
    const MappingDescriptionSuffix = ' - Google plus Commando';

    function defineMapping (mode, cmd) {
      let gv =
        liberator.globalVariables[
          'gplus_commando_map_' +
          cmd.replace(/[A-Z]/g, function (m) ('_' + m.toLowerCase()))
        ];
      if (!gv)
        return;
      let func = Commands[cmd];
      mappings.addUserMap(
        [mode],
        gv.split(/\s+/),
        cmd + MappingDescriptionSuffix,
        function (count) {
          try {
            func(count);
          } catch (e if (e instanceof GPCError)) {
            /* DO NOTHING */
          }
        },
        {
          count: func.length === 1,
          matchingUrls: MatchingUrls
        }
      );
    }

    'comment plusone share next prev post yank notification cancel unfold menu mute'.split(/\s/).forEach(defineMapping.bind(null, modes.NORMAL));
    'submit'.split(/\s/).forEach(defineMapping.bind(null, modes.INSERT));

    mappings.addUserMap(
      [modes.INSERT],
      ['<Esc>'],
      'Escape from input area',
      function () {
        if (liberator.focus) {
          let esc = mappings.getDefault(modes.NORMAL, '<Esc>');
          esc.action.apply(esc, arguments);
        } else {
          click(Elements.focusedEditor.button.cancel);
          // FIXME
          window.document.commandDispatcher.advanceFocus();
          modes.reset();
          PostHelp.hide();
        }
      },
      {
        matchingUrls: MatchingUrls
      }
    );

  })();

  // }}}

  // Define hints {{{

  (function () {

    const HintStyleName = 'google-plus-commando-hint';

    function s2x (s)
      s.replace(/^\./, '');

    [
      ['o', 'f', function (e) click(e)],
      ['t', 'F', function (e) buffer.followLink(e, liberator.NEW_TAB)],
    ].forEach(function ([modeChar, mapKey, action]) {
      let modeName = 'google-plus-comando-hint-' + modeChar;

      hints.addMode(
        modeName,
        hints._hintModes[modeChar].prompt,
        function (elem, count) {
          function mouseEvent (name) {
            let evt = elem.ownerDocument.createEvent('MouseEvents');
            evt.initMouseEvent(name, true, true, elem.ownerDocument.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            elem.dispatchEvent(evt);
          }

          let plusone = elem.getAttribute('g:type') === 'plusone';
          if (plusone)
            mouseEvent('mouseover');
          action(elem, count);
          if (plusone)
            mouseEvent('mouseout');
        },
        function () {
          function removeRoot (s)
            s.replace(/^\s*\/\//, '');

          const ext = [
            'span[@role="button"]',
            'div[@role="button"]',
            'div[@data-content-type]',
            'img[contains(@class,"ea-g-Vc-pa")]',
            'div[contains(@class,"a-z-nb-A")]'
          ];

          let xpath = options['hinttags'].split(/\s*\|\s*/).map(removeRoot).concat(ext);

          for (let [, name] in Iterator(['viewer', 'dialog'])) {
            if (!Elements[name])
              continue;
            xpath.push(String(<>div[contains(@class, "{s2x(S.closeButton)}")]</>));
            xpath = xpath.map(function (it) String(<>*[contains(@class, "{s2x(S[name].root)}")]//{it}</>))
            break;
          }

          styles.addSheet(false, HintStyleName, 'plus\\.google\\.com', '.a-b-f-W-Tj.a-f-W-Tj { display: inline  !important }');

          return xpath.map(function (it) '//' + it).join(' | ');
        }
      );

      mappings.addUserMap(
        [modes.NORMAL],
        [liberator.globalVariables['gplus_commando_map_hint_' + modeChar] || mapKey],
        'Hit a hint - Google plus Commando',
        function () hints.show(modeName),
        {
          matchingUrls: RegExp('^https://plus\\.google\\.com/.*')
        }
      );
    });

    plugins.libly.$U.around(
      hints,
      'hide',
      function (next) {
        setTimeout(function () styles.removeSheet(false, HintStyleName, 'plus\\.google\\.com'), 0);
        return next();
      },
      true
    );

    hints.addMode("G", "Google+ Post",
      function action(elm) {
        var src = elm.src;
        commandline.open("", "googleplus -i " + src + " ", modes.EX);
      },
      function getPath() {
        return util.makeXPath(["img"]);
      });

  })();

  // }}}

  // Define Google+ post command {{{

  var HOME_URL = "https://plus.google.com/",
      POST_URL_BASE = "https://plus.google.com/u/0/_/sharebox/post/";

  /**
   * ${RUNTIMEPATH}/info/{profileName}/googlePlus のデータ取得/保存
   * @type {Object}
   */
  var store = storage.newMap("googlePlus", { store: true });

  commands.addUserCommand(["gp", "googleplus"], "Google+",
    function (args) {
      // ----------------------
      // -setup オプション
      // ----------------------
      if ("-setup" in args) {
        setupGooglePlus();
        return;
      }

      var message = args[0] || "",
          acls = null;

      // ----------------------
      // -link オプション
      // ----------------------
      var win = null;
      if ("-link" in args) {
        win = content;
      }
      // ----------------------
      // -imageURL オプション
      // ----------------------
      var image = null;
      if ("-imageURL" in args) {
        image = args["-imageURL"];
      }

      // ----------------------
      // -to オプション
      // ----------------------
      if ("-to" in args && args["-to"].indexOf("anyone") == -1)
        acls = [acl for ([,acl] in Iterator(store.get("CIRCLES", []))) if (args["-to"].indexOf(acl[0]) != -1)];

      // 引数が何も無い場合は、Google+のページへ
      if (!message && !win && !image) {
        let tab = getGooglePlusTab();
        if (tab)
          gBrowser.mTabContainer.selectedItem = tab;
        else
          liberator.open(HOME_URL, { where: liberator.NEW_TAB });

        return;
      }
      window.setTimeout(function() {
        var pd = new PostData(message, win, image, acls);
        postGooglePlus(pd);
      }, 0);
    }, {
      literal: 0,
      options: [
        [["-link", "-l"], commands.OPTION_NOARG],
        [["-imageURL", "-i"], commands.OPTION_STRING],
        [["-to", "-t"], commands.OPTION_LIST, null,
          function (context, args) {
            let [, prefix] = context.filter.match(/^(.*,)[^,]*$/) || [];
            if (prefix)
              context.advance(prefix.length);

            return [["anyone", "to public"]].concat([v for ([,v] in Iterator(store.get("CIRCLES", [])))]);
          }],
        [["-setup"], commands.OPTION_NOARG],
      ],
  },true);

  /**
   * Google+のページから必要データを保存する
   * @return {Boolean}
   */
  function setupGooglePlus () {
    var tab = getGooglePlusTab();
    if (tab) {
      let data = tab.linkedBrowser.contentWindow.wrappedJSObject.OZ_initData;
      if (data) {
        store.set("UID", data[2][0]);
        store.set("AT", data[1][15]);
        let circles = data[12][0];
        // CIRCLES[]: [[Name, Description, ID], ...]
        store.set("CIRCLES", circles.slice(0, circles.length / 2).map(function (c) [c[1][0], c[1][2], c[0][0]]));
        liberator.echomsg("Initialized: googleplus");
        return true;
      }
    }
    liberator.echoerr("Faild: initialize googleplus");
    return false;
  }

  /**
   * Google+のタブを取ってくる
   * @return {Element|null}
   */
  function getGooglePlusTab () {
    var tabs = gBrowser.tabs;
    for (let i = 0, tab; tab = tabs[i]; ++i) {
      if (tab.linkedBrowser.currentURI.spec.indexOf(HOME_URL) == 0) {
        return tab;
      }
    }
    return null;
  }

  /**
   * Post to Google+
   * @param {PostData} aPostData
   */
  function postGooglePlus (aPostData) {
    var data = aPostData.getPostData();
    var queries = [];
    for (let key in data)
      queries.push(key + "=" + encodeURIComponent(data[key]));

    var xhr = new XMLHttpRequest();
    xhr.mozBackgroundRequest = true;
    xhr.open("POST", aPostData.POST_URL, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
    xhr.setRequestHeader("Origin", HOME_URL);
    xhr.onreadystatechange = postGooglePlus.readyStateChange;
    xhr.send(queries.join("&"));
  }
  /**
   * Google+への送信状況を表示する
   * @param {Event} aEvent
   *                aEvent.target は XMLHttpRequestオブジェクト
   */
  postGooglePlus.readyStateChange = function GooglePlus_readyStateChange (aEvent) {
    var xhr = aEvent.target,
        msg = "Google+: ",
        XBW = window.XULBrowserWindow;
    if (xhr.readyState == 4) {
      msg += (xhr.status == 200) ? "Posted" : "Post faild (" + xhr.statusText + ")";
      window.setTimeout(function(XBW, msg){
        if (XBW.jsDefaultStatus.indexOf("Google+:") == 0)
          XBW.setJSDefaultStatus("");
      }, 2000, XBW, msg);
    } else {
      msg += "sending...";
    }
    liberator.log(msg, 0);
    XBW.setJSDefaultStatus(msg);
  };

  XPCOMUtils.defineLazyServiceGetter(this, "MIME", "@mozilla.org/mime;1", "nsIMIMEService");

  /**
   * Google+への送信データ生成
   * @Constructor
   * @param {String}    aMessage
   * @param {Object}    aPage             現ページのコンテンツ情報
   * @param {Selection} [aPage.selection] 選択オブジェクト
   * @param {String}    [apage.title]     現ページのタイトル
   * @param {String}    [aPage.url]       現ページURL
   * @param {String}    [aPage.image]     表示させたい画像URL
   * @param {Array}     aACLs             ACL[]
   */
  function PostData () { this.init.apply(this, arguments); }
  PostData.sequence = 0;
  PostData.prototype = {
    init: function PD_init (aMessage, aWindow, aImageURL, aACLs) {
      this.message = aMessage;
      this.window = aWindow;
      this.imageURL = aImageURL;

      this.UID = store.get("UID", null);
      liberator.assert(this.UID, "Google+ Error: UID is not set. Please login and `:googleplus -init'");
      this.AT = store.get("AT", null);
      liberator.assert(this.AT, "Google+ Error: AT is not set. Please login and `:googleplus -init'");

      this.setACLEnties(aACLs);
    },
    get token () {
      var t = "oz:" + this.UID + "." + this.date.getTime().toString(16) + "." + this.sequence.toString(16);
      Object.defineProperty(this, "token", { value: t, });
      return t;
    },
    get date () {
      var d = new Date;
      Object.defineProperty(this, "date", { value: d, });
      return d;
    },
    get sequence () {
      var s = PostData.sequence++;
      Object.defineProperty(this, "sequence", { value: s });
      return s;
    },
    get reqid () {
      var r = this.date.getHours() + 3600 + this.date.getMinutes() + 60 + this.date.getSeconds() + this.sequence * 100000;
      Object.defineProperty(this, "reqid", { value: r });
      return r;
    },
    get POST_URL () {
      var url = POST_URL_BASE + "?_reqid=" + this.reqid + "&rt=j";
      Object.defineProperty(this, "POST_URL", { value: url });
      return url
    },
    aclEntries: [{
      scope: {
        scopeType: "anyone",
        name: "Anyone",
        id: "anyone",
        me: true,
        requiresKey: false
      },
      role: 20,
    }, {
      scope: {
        scopeType: "anyone",
        name: "Anyone",
        id: "anyone",
        me: true,
        requiresKey: false,
      },
      role: 60
    }],
    setACLEnties: function PD_setACLEnties (aACLs) {
      if (!aACLs || aACLs.length == 0)
        return this.aclEntries = Object.getPrototypeOf(this).aclEntries;

      var entries = [];
      for (let i = 0, len = aACLs.length; i < len; ++i) {
        let acl = aACLs[i];
        let scope = {
          scopeType: "focusGroup",
          name: acl[0],
          id: this.UID + "." + acl[2],
          me: false,
          requiresKey: false,
          groupType: "p"
        };
        entries.push({ scope: scope, role: 60 });
        entries.push({ scope: scope, role: 20 });
      }
      return this.aclEntries = entries;
    },
    getPostData: function PD_getPostData () {
      var spar = [v for each(v in this.generateSpar())];
      return {
        spar: JSON.stringify(spar),
        at  : this.AT
      };
    },
    generateSpar: function PD_generateSpar() {
      for (let i = 0, len = 17; i < len; ++i) {
        switch (i) {
        case 0:
          yield this.message;
          break;
        case 1:
          yield this.token;
          break;
        case 6:
          if (!this.window && !this.imageURL) {
            yield null;
          } else {
            var media = LinkDetector.get(this.window, this.imageURL);
            var data = [JSON.stringify(media.generateData())];
            if (media.hasPhoto) {
              data.push(JSON.stringify(media.generateData(true)));
            }
            yield JSON.stringify(data);
          }

          break;
        case 8:
          yield JSON.stringify({ aclEntries: this.aclEntries });
          break;
        case 9:
        case 11:
        case 12:
          yield true;
          break;
        case 15:
        case 16:
          yield false;
          break;
        case 10:
        case 14:
          yield [];
          break;
        default:
          yield null;
          break;
        }
      }
    },
  };
  const LinkDetector = (function() {
    var commonProto = {
      init: function (win, imageURL) {
        this.window = win;
        this.imageURL = imageURL;
        if (imageURL) {
          if (win)
            this.hasPhoto = true;

          this.setupImage();
        }
      },
      type: {
        TITLE: 3,
        MEDIA_LINK: 5,
        UPLOADER: 9,
        TEXT: 21,
        TYPE: 24,
        IMAGE: 41,
        PROVIDER: 47,
      },
      generateData: function (isPhoto) {
        var data = new Array(48);
        data[this.type.TITLE] = this.getTitle(isPhoto);
        data[this.type.MEDIA_LINK] = this.getMediaLink(isPhoto);
        data[this.type.UPLOADER] = this.getUploader(isPhoto);
        data[this.type.TEXT] = this.getContentsText(isPhoto);
        data[this.type.TYPE] = this.getMediaType(isPhoto);
        data[this.type.IMAGE] = this.getMediaImage(isPhoto);
        data[this.type.PROVIDER] = this.getProvider(isPhoto);
        return data;
      },
      hasPhoto: false,
      imageElement: null,
      setupImage: function () {
        let imgs = content.document.images;
        for (let i = 0, len = imgs.length, img; img = imgs[i]; ++i) {
          if (img.src == this.imageURL) {
            this.imageElement = img;
          }
        }
      },
      getMimeType: function (uri, defaultType) {
        if (!(uri instanceof Ci.nsIURI))
          uri = util.createURI(uri);

        try {
          return MIME.getTypeFromURI(uri);
        } catch (e) {}
        return defaultType;
      },
      getTitle: function (isPhoto) {
        return (isPhoto || !this.window) ? null : this.window.document.title;
      },
      getContentsText: function (isPhoto) {
        if (!this.window || isPhoto)
          return null;

        var sel = this.window.getSelection();
        if (sel.isCollapsed)
          return "";

        var sels = [];
        for (let i = 0, count = sel.rangeCount; i < count; ++i) {
          let r = sel.getRangeAt(i),
              fragment = r.cloneContents();
          sels.push(Elements.node2txt(fragment, r.commonAncestorContainer.localName));
        }
        return sels.join("<br/>(snip)<br/>");
      },
      getUploader: function () { return []; },
      getMediaLink: function (isPhoto) {
        if (this.window && !isPhoto)
          return [null, this.window.location.href];

        var data = [null, this.imageURL];
        if (this.imageElement)
          data.push(this.imageElement.height, this.imageElement.width);

        return data;
      },
      getMediaType: function (isPhoto) {
        if (isPhoto) {
          var type = this.getMimeType(this.imageURL, "image/jpeg");
          var data = [null, this.imageURL, null, type, "photo", null,null,null,null,null,null,null];
          if (this.imageElement)
            data.push(this.imageElement.width, this.imageElement.height);
          else
            data.push(null,null);

          return data;
        }
        if (this.window && !isPhoto) {
          type = this.window.document.contentType;
          switch (type.split("/")[0]) {
          case "image":
            return [null, this.window.location.href, null, type, "image"];
          case "text":
          default:
            return [null, this.window.location.href, null, "text/html", "document"];
          }
        } else if (this.imageURL) {
          type = this.getMimeType(this.imageURL, "image/jpeg");
          return [null, this.imageURL, null, type, "image"];
        }
        return null
      },
      getMediaImage: function (isPhoto) {
        var url;
        if (this.window && !isPhoto) {
          let type = this.window.document.contentType.split("/");
          if (type[0] != "image") {
            let host = this.window.location.host;
            url = "//s2.googleusercontent.com/s2/favicons?domain=" + host;
            return [ [null, url, null, null], [null, url, null, null] ];
          } else {
            url = this.window.location.href;
            return [ [null, url, null, null], [null, url, null, null] ];
          }
        }

        let data = [null, this.imageURL];
        let w = null, h = null;
        if (this.imageElement) {
          w = this.imageElement.width, h = this.imageElement.height;
          w = w / h * 120;
          h = 120;
        }
        data.push(h, w);
        return [ data, data ];
      },
      getProvider: function (isPhoto) {
        return [ [null, (isPhoto ? "images" : ""), "http://google.com/profiles/media/provider"] ];
      }
    };
    var classes = {}, checker = {};
    function MediaLink() { this.init.apply(this, arguments); };
    MediaLink.prototype = commonProto;

    var self = {
      addType: function (name, checkFunc, proto) {
        checker[name] = checkFunc;
        var func = function () { this.init.apply(this, arguments); };
        proto.__super__ = proto.__proto__ = commonProto;
        func.prototype = proto;
        classes[name] = func;
      },
      get: function (aWindow, aImageURL) {
        for (let [key, checkFunc] in Iterator(checker)) {
          if (checkFunc(aWindow, aImageURL)) {
            return new classes[key](aWindow, aImageURL);
          }
        }
        return new MediaLink(aWindow, aImageURL);
      }
    };

    (function() {
      // -------------------------------------------------------------------------
      // YouTube
      // ----------------------------------------------------------------------{{{
      self.addType("youtube",
        function (win) {
          if (!win) return false;

          return /^https?:\/\/(?:.*\.)?youtube.com\/watch/.test(win.location.href);
        }, {
          get VIDEO_ID () {
            var id = this.window.wrappedJSObject.yt.config_.VIDEO_ID;
            Object.defineProperty(this, "VIDEO_ID", { value: id });
            return id;
          },
          getMediaLink: function () [null, "http://www.youtube.com/v/" + this.VIDEO_ID + "&hl=en&fs=1&autoplay=1"],
          getContentsText: function () this.window.document.querySelector("meta[name=description]").content,
          getMediaType: function () [null, this.window.location.href, null, "application/x-shockwave-flash", "video"],
          getMediaImage: function () {
            var url = "https://ytimg.googleusercontent.com/vi/" + this.VIDEO_ID + "/hqdefault.jpg";
            return [ [null, url, 120, 160], [null, url, 120, 160] ];
          },
          getProvider: function () [ [null, "youtube", "http://google.com/profiles/media/provider"] ],
        }); // }}}
      // -------------------------------------------------------------------------
      // Gyazo
      // ----------------------------------------------------------------------{{{
      self.addType("gyazo",
        function (win, image) {
          var reg = /^http:\/\/gyazo\.com\/\w+(\.png)?/;
          return reg.test(image);
        }, {
          init: function (win, imageURL) {
            this.window = win;
            if (imageURL.lastIndexOf(".png") != imageURL.length - 4)
              imageURL += ".png";

            this.imageURL = imageURL;
            this.hasPhoto = true;
          },
        });
      // }}}
    })();
    return self;
  })();

  // }}}

  // Export {{{

  __context__.command  = Commands;
  __context__.element  = Elements;
  __context__.linkDetector = LinkDetector;

  // }}}

})();

// vim:sw=2 ts=2 et si fdm=marker: