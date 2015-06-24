<!-- // Hide

// *** COMMON CROSS-BROWSER COMPATIBILITY CODE ***

var isDOM = document.getElementById?1:0;
var isIE = document.all?1:0;
var isNS4 = (navigator.appName=='Netscape' && !isDOM)?1:0;
var isIE4 = (isIE && !isDOM)?1:0;
var isDyn = (isDOM||isIE4||isNS4);

function getRef(id, par)
{
 par = (!par ? document : (par.navigator ? par.document : par));
 return (isIE ? par.all[id] :
  (isDOM ? (par.getElementById?par:par.ownerDocument).getElementById(id) :
  par.layers[id]));
}

function getSty(id, par)
{
 return (isNS4 ? getRef(id, par) : getRef(id, par).style)
}

if (!window.LayerObj) var LayerObj = new Function('id', 'par',
 'this.ref=getRef(id, par); this.sty=getSty(id, par); return this');
function getLyr(id, par) { return new LayerObj(id, par) }

function LyrFn(fn, fc)
{
 LayerObj.prototype[fn] = new Function('var a=arguments,p=a[0]; with (this) { '+fc+' }');
}
LyrFn('x','if (!isNaN(p)) sty.left=p; else return parseInt(sty.left)');
LyrFn('y','if (!isNaN(p)) sty.top=p; else return parseInt(sty.top)');
LyrFn('vis','sty.visibility=p');
LyrFn('bgColor','if (isNS4) sty.bgColor=(p?p:null); ' +
 'else sty.backgroundColor=p');
LyrFn('bgImage','if (isNS4) sty.background.src=(p?p:null); ' +
  'else sty.backgroundImage=(p?"url("+p+")":"") ');
LyrFn('write','if (isNS4) with (ref.document) {write(p);close()} else ref.innerHTML=p');
LyrFn('alpha','var f=ref.filters; if (f) {' +
 'if (sty.filter.indexOf("alpha")==-1) sty.filter+="alpha()"; ' +
 'if (f.length&&f.alpha) f.alpha.opacity=p } else if (isDOM) sty.MozOpacity=(p/100)');


function setLyr(lVis, docW, par)
{
 if (!setLyr.seq) setLyr.seq=0;
 if (!docW) docW=0;
 var obj = (!par ? (isNS4 ? window : document.body) :
  (!isNS4 && par.navigator ? par.document.body : par));
 var newID='_js_layer_'+setLyr.seq++;

 if (isIE) obj.insertAdjacentHTML('beforeEnd', '<div id="'+newID+
  '" style="position:absolute"></div>');
 else if (isDOM)
 {
  var newL=document.createElement('div');
  obj.appendChild(newL);
  newL.id=newID; newL.style.position='absolute';
 }
 else if (isNS4)
 {
  var newL=new Layer(docW, obj);
  newID=newL.id;
 }

 var lObj=getLyr(newID, par);
 with (lObj.sty) { visibility=lVis; left=0; top=0; width=docW }
 return lObj;
}


if (!window.page) var page = { win: window, minW: 0, minH: 0 }

page.winW=function()
 { return Math.max(this.minW, isIE?this.win.document.body.clientWidth:this.win.innerWidth) }
page.winH=function()
 { return Math.max(this.minH, isIE?this.win.document.body.clientHeight:this.win.innerHeight) }

page.scrollX=function()
 { return isIE?this.win.document.body.scrollLeft:this.win.pageXOffset }
page.scrollY=function()
 { return isIE?this.win.document.body.scrollTop:this.win.pageYOffset }



// *** MOUSE EVENT CONTROL FUNCTIONS ***


// Most of these are passed the relevant 'menu Name' and 'item Number'.
// The 'with (this)' means it uses the properties and functions of the current menu object.
function popOver(mN, iN) { with (this)
{
 // Cancel any pending menu hides from a previous mouseout.
 clearTimeout(hideTimer);
 // Set the 'over' variables to point to this item.
 overM = mN;
 overI = iN;
 // A quick reference to this item.
 var thisI = menu[mN][iN];

 // Call the 'onMouseOver' event if it exists, and the item number is 1 or more.
 if (iN && this.onmouseover) this.onmouseover();


 // Remember what was lit last time, and compute a new hierarchy.
 litOld = litNow;
 litNow = new Array();
 var litM = mN, litI = iN;
 while(1)
 {
  litNow[litM] = litI;
  // If we've reached the top of the hierarchy, exit loop.
  if (litM == 'root') break;
  // Otherwise repeat with this menu's parent.
  litI = menu[litM][0].parentItem;
  litM = menu[litM][0].parentMenu;
 }

 // If the two arrays are the same, return... no use hiding/lighting otherwise.
 var same = true;
 for (var z in menu) if (litNow[z] != litOld[z]) same = false;
 if (same) return;



 // Cycle through menu array, lighting and hiding menus as necessary.
 for (thisM in menu)
 {
  // Doesn't exist yet? Keep rollin'...
  if (!menu[thisM][0].lyr) continue;

  // The number of this menu's item that is to be lit, undefined if none.
  litI = litNow[thisM];
  oldI = litOld[thisM];

  // If it's lit now and wasn't before, highlight...
  if (litI && (litI != oldI)) changeCol(thisM, litI, true);

  // If this item was lit but another is now, dim the old item.
  if (oldI && (oldI != litI)) changeCol(thisM, oldI, false);

  // If this menu has no items from the current hierarchy in it, hide it.
  if (isNaN(litI)) { menu[thisM][0].lyr.vis('hidden') }
 }


 // Get target menu to show - if we've got one, position & show it.
 clearTimeout(showTimer);
 nextMenu = '';
 if (thisI.type == 'sm:')
 {
  // The target menu and the layer object of the current menu itself (not this item).
  var targ = thisI.href, lyrM = menu[mN][0].lyr;

  // Add current menu/item positions to the target's offset to set its position, show it.
  with (menu[targ][0])
  {
   // If it's not created yet, call the update function.
   if (!lyr) update(targ);
   // Update routine hasn't created it (page not loaded etc)? Nothing to see here...
   if (!lyr) return;

   // If the offset is a number add this item's position else just calculate position.
   lyr.x(eval(offX) + (typeof(offX)=='number' ? lyrM.x() + thisI.lyr.x() : 0));
   lyr.y(eval(offY) + (typeof(offY)=='number' ? lyrM.y() + thisI.lyr.y() : 0));

   // Either show immediately or after a delay if set. Set nextMenu to the impending show.
   showStr = myName + '.menu.' + targ + '[0].lyr.vis("visible")';
   nextMenu = targ;
   if (showDelay) showTimer = setTimeout(showStr, showDelay);
   else eval(showStr);
  }
 }
}}


function popChangeCol(mN, iN, isOver) { with (this.menu[mN][iN])
{
 // Swap the background colour/image depending on highlight state.
 // If it's got a period in it, call it an image, otherwise it must be a colour.
 var col = isOver ? overCol : outCol;
 if (col.indexOf('.') == -1) lyr.bgColor(col);
 else lyr.bgImage(col);

 // Test for other style changes, we can skip them if not needed.
 var doFX = ((overClass != outClass) || (outBorder != overBorder));

 // In Netscape 4, rewrite layer contents (causes a little flickering)...
 if (doFX && isNS4) lyr.write(this.getHTML(mN, iN, isOver));

 // ...otherwise manipulate the DOM tree for IE/NS6+ (faster than rewriting contents).
 else if (doFX) with (lyr.ref)
 {
  className = (isOver ? overBorder : outBorder);
  var chl = (isDOM ? childNodes : children)
  for (var i = 0; i < chl.length; i++) chl[i].className = (isOver ? overClass : outClass);
 }

 // Alpha filtering activated? Might as well set that then too...
 // Weirdly it has to be done after the border change, another random Mozilla bug...
 if (typeof(outAlpha)=='number') lyr.alpha(isOver ? overAlpha : outAlpha);
}}


function popOut(mN, iN) { with (this)
{
 // Sometimes, across frames, overs and outs can get confused. If this is called before
 // the relevant over command, return...
 if ((mN != overM) || (iN != overI)) return;
 // Evaluate the onmouseout event, if any.
 if (this.onmouseout) this.onmouseout();

 var thisI = menu[mN][iN];

 // Stop showing another menu if this item isn't pointing to the same one.
 if (thisI.href != nextMenu) clearTimeout(showTimer);

 // Hide all menus rapidly (if it's a root menu item without a popout) or as specified.
 // Remember that the timeout is cancelled by another instance of the over function.
 // Calling 'over("root", 0)' hides all menus but the root menu, and highlights no items.
 // If hideDelay equals zero the menus are never hidden.
 if (hideDelay)
 {
  var delay = ((mN == 'root') && (thisI.type != 'sm:')) ? 50 : hideDelay;
  hideTimer = setTimeout(myName + '.over("root", 0)', delay);
 }

 // Clear the 'over' variables.
 overM = 'root';
 overI = 0;
}}


function popClick(evt) { with (this)
{
 // If the moused over item number isn't 0, activate it!
 if (overI)
 {
  // Evaluate the onclick event, if any.
  if (this.onclick) this.onclick();

  var thisI = menu[overM][overI];

  with (thisI) switch (type)
  {
   // Targeting another popout? Clicking will get you nowhere...
   case 'sm:': return;
   // A JavaScript function? Eval() it and break out of switch.
   case 'js:': { eval(href); break }
   // Otherwise, point to the window if nothing else and navigate.
   case '': type = 'window';
   default: if (href) eval(type + '.location.href = "' + href + '"');
  }
 }

 // Whatever happens, hide the menus when clicked.
 over('root', 0);
}}


function popClearLyr(wN) { with (this)
{
 // Pass a window name on unload. Any menus in that window have their layer objects
 // deleted, for recreation later, seems to be necessary for NS4.
 for (mN in menu) with (menu[mN][0]) if (par == wN) lyr = null;
}}


// *** MENU OBJECT CONSTRUCTION FUNCTIONS ***

// This takes arrays of data and names and assigns the values to a specified object.
function addProps(obj, data, names, addNull)
{
 for (var i = 0; i < names.length; i++) if(i < data.length || addNull) obj[names[i]] = data[i];
}

function ItemStyle()
{
 // Like the other constructors, this passes a list of property names that correspond to the list
 // of arguments. Feel free to add more than the first 4 to the addItem() command if you want.
 var names = ['len', 'spacing', 'popInd', 'popPos', 'pad', 'outCol', 'overCol', 'outClass',
  'overClass', 'outBorder', 'overBorder', 'outAlpha', 'overAlpha'];
 addProps(this, arguments, names, true);
}

function popStartMenu(mName) { with (this)
{
 // Create a new array within the menu object if none exists already, and a new menu object within.
 if (!menu[mName]) { menu[mName] = new Array(); menu[mName][0] = new Object(); }

 // Set this as the active menu to which new items are added, and clean out existing items.
 actMenu = mName;
 menu[mName].length = 1;
 nextItem = 1;
 // A quick reference to the current menu descriptor -- array index 0, 1+ are items.
 var aM = menu[mName][0];

 // Not all of these are actually passed to the constructor -- the last two are null.
 // N.B: I pass 'isVert' twice so the first parameter (the menu name) is overwritten & ignored.
 var names = ['isVert', 'isVert', 'offX','offY', 'width', 'itemSty', 'par', 'parentMenu',
  'parentItem'];
 addProps(aM, arguments, names, true);

 // Reuse old layers if we can, no use creating new ones every time the menus refresh.
 if (!aM.lyr) aM.lyr = null;
}}

function popAddItem() { with (this)
{
 // Add these properties onto a new 'active Item' at the end of the active menu.
 var aI = menu[actMenu][nextItem++] = new Object();

 // Add function parameters to object. Again, the last three are undefined, set later.
 var names = ['text', 'href', 'type', 'itemSty', 'len', 'spacing', 'popInd', 'popPos',
  'pad', 'outCol', 'overCol', 'outClass', 'overClass', 'outBorder', 'overBorder',
  'outAlpha', 'overAlpha', 'iW', 'iH', 'lyr'];
 addProps(aI, arguments, names, true);

 // Find an applicable itemSty -- either passed to this item or the menu[0] object.
 var iSty = (arguments[3] ? arguments[3] : menu[actMenu][0].itemSty);
 // Loop through its properties, add them if they don't already exist (overridden e.g. length).
 for (prop in iSty) if (aI[prop] == window.UnDeFiNeD) aI[prop] = iSty[prop];

 // In NS4, since borders are assigned to the table rather than layer, increase padding.
 if (isNS4 && aI.outBorder) aI.pad++;
}}



// *** MAIN MENU CREATION/UPDATE FUNCTIONS ***

// Returns the inner HTML of an item, used for menu generation, and highlights in NS4.
function popGetHTML(mN, iN, isOver) { with (this)
{
 var itemStr = '';
 with (menu[mN][iN])
 {
  var textClass = (isOver ? overClass : outClass);

  // If we're supposed to add a popout indicator, add it before text so it appears below in NS4.
  // Note the (iW - 15): the position is hardcoded at 15px from the item's right edge.
  if ((type == 'sm:') && popInd)
  {
   if (isNS4) itemStr += '<layer class="' + textClass + '" left="'+ ((popPos+iW) % iW) +
    '" top="' + pad + '">' + popInd + '</layer>';
   else itemStr += '<div class="' + textClass + '" style="position: absolute; left: ' +
    ((popPos+iW) % iW) + '; top: ' + pad + '">' + popInd + '</div>';
  }

  // For NS4, if a border is assigned, add a spacer to push border out to layer edges.
  // The text layer must completely overlay this table as well for proper click capturing.
  // Add a link both to generate an onClick event and to stop the ugly I-beam text cursor appearing.
  if (isNS4) itemStr += (outBorder ? '<span class="' + (isOver ? overBorder : outBorder) +
   '"><spacer type="block" width="' + (iW - 8) + '" height="' + (iH - 8) + '"></span>' : '') +
   '<layer left="' + pad + '" top="' + pad + '" width="' + (iW - (2 * pad)) + '" height="' +
   (iH - (2 * pad)) + '"><a class="' + textClass + '" href="#" ' +
   'onClick="return false" onMouseOver="status=\'\'; ' + myName + '.over(\'' + mN + '\',' +
   iN + '); return true">' + text + '</a></layer>';

  // IE4+/NS6 is an awful lot easier to work with sometimes.
  else itemStr += '<div class="' + textClass + '" style="position: absolute; left: ' + pad +
   '; top: ' + pad + '; width: ' + (iW - (2 * pad)) + '; height: ' + (iH - (2 * pad)) +
   '">' + text + '</div>';
 }
 return itemStr;
}}


// The main menu creation/update routine. Optionally pass the name of one menu to update.
function popUpdate(upMN) { with (this)
{
 // 'isDyn' (set at the very top of the script) signifies a DHTML-capable browser.
 if (!isDyn) return;

 // Loop through menus, using properties of menu description object (array index 0)...
 for (mN in menu) with (menu[mN][0])
 {
  // If we're updating one specific menu, only run the code for that.
  if (upMN && (upMN != mN)) continue;

  // Another check -- if it's in another window that hasn't loaded completely, we shouldn't
  // create layers dynamically. par equals nothing for the current window, incidentally,
  // and subframes will have a script in them to set document.readyState for NS browsers.
  var eP = eval(par);
  if (eP && eP.navigator && (eP.document.readyState != 'complete')) continue;


  // Variable for holding HTML for items and positions of next item.
  var str = '', iX = 0, iY = 0;

  // Remember, items start from 1 in the array (0 is menu object itself, above).
  // Also use properties of each item nested in the other with() for construction.
  for (var iN = 1; iN < menu[mN].length; iN++) with (menu[mN][iN])
  {
   // An ID for divs/layers contained within the menu.
   var itemID = myName + '_' + mN + '_' + iN;

   // Now is a good time to assign another menu's parent to this if we've got a popout item.
   if (type == 'sm:')
   {
    menu[href][0].parentMenu = mN;
    menu[href][0].parentItem = iN;
   }

   // NS6 disagrees with other browsers as to whether borders increase widths, so fix here.
   var shrink = (outBorder && isDOM && !isIE ? 2 : 0)
   // The actual dimensions of the items, store as item properties so they can be accessed later.
   iW = (isVert ? width : len) - shrink;
   iH = (isVert ? len : width) - shrink;

   // Have we been given a background image? It'll have a period in its name if so...
   var isImg = (outCol.indexOf('.') != -1) ? true : false;

   // Create a div or layer text string with appropriate styles/properties.
   // OK, OK, I know this is a little obtuse in syntax, but it's small...
   // At the end we set the alpha transparency (if specified) and cursor to be a hand
   // if it's not a 'sm:' item or blank -- those items get a regular cursor
   if (isDOM || isIE4)
   {
    str += '<div id="' + itemID + '" ' + (outBorder ? 'class="' + outBorder + '" ' : '') +
     'style="position: absolute; left: ' + iX + '; top: ' + iY + '; width: ' + iW + '; height: ' +
     iH + '; ' + (outCol ? 'background: ' + (isImg ? 'url('+ outCol+')' : outCol) : '') +
     ((typeof(outAlpha)=='number') ? '; filter: alpha(opacity='+ outAlpha + '); -moz-opacity: ' +
      (outAlpha/100) : '') +
     '; cursor: ' + ((type!='sm:' && href) ? (isIE ? 'hand' : 'pointer') : 'default') + '" ';
   }
   else if (isNS4)
   {
    // NS4's borders must be assigned within the layer so they stay when content is replaced.
    str += '<layer id="' + itemID + '" left="' + iX + '" top="' + iY + '" width="' +
     iW + '" height="' + iH + '" ' + (outCol ? (isImg ? 'background="' : 'bgcolor="') +
     outCol + '" ' : '');
   }

   // Add mouseover and click handlers, contents, and finish div/layer.
   str += 'onMouseOver="' + myName + '.over(\'' + mN + '\',' + iN + ')" ' +
     'onMouseOut="' + myName + '.out(\'' + mN + '\',' + iN + ')">' +
     getHTML(mN, iN, false) + (isNS4 ? '</layer>' : '</div>');

   // Move next item position down or across by this item's length and additional spacing.
   // Subtract 1 so borders overlap slightly.
   var spc = (outBorder ? 1 : 0)
   if (isVert) iY += len + spacing - spc;
   else iX += len + spacing - spc;

  // End loop through items and with(menu[mN][iN]).
  }



  // Now, create a new layer/div object using my setLyr() function above.
  // N.B: Still using properties of menu[mN][0]...

  // If we've got a layer created already, there's no use creating another!.
  // In IE4, we must shrink the menus to stop them sizing to the full body size -- thanks
  // to Jeff Blum and Paul Maden for debugging this for me :). Also we've got to set a
  // timeout to fix up IE4 again on menu update, for some obscure reason.
  if (!lyr) lyr = setLyr('hidden', 3, eval(par));
  else if (isIE4) setTimeout(myName + '.menu.' + mN + '[0].lyr.sty.width=9', 50);

  // Whatever happens, give it a high Z-index, and write its content.
  with (lyr) { sty.zIndex = 1000; write(str) }

  // Now items have been written, loop through them again to set up references.
  for (var i = 1; i < menu[mN].length; i++)
   menu[mN][i].lyr = getLyr(myName + '_' + mN + '_' + i, lyr.ref);

 // End loop through menus and with (menu[mN][0]).
 }

 // Position and show the root menu now that's all over. Phew!
 position();
 menu.root[0].lyr.vis('visible');
}}


function popPosition(wN) { with (this)
{
 // Pass this a window name to position the absolute menus in that window, otherwise all are.
 for (mN in menu) if (!wN || menu[mN][0].par == wN) with (menu[mN][0])
 {
  // If the menu hasn't been created, and there's no layer reference, return.
  if (!lyr) return;

  // If either of the offsets is a string or its the root menu, position it.
  if (typeof(offX)!='number' || mN=='root') lyr.x(eval(offX));
  if (typeof(offY)!='number' || mN=='root') lyr.y(eval(offY));
 }
}}


// *** POPUP MENU MAIN OBJECT CONSTRUCTOR ***

function PopupMenu(myName)
{
 // These are the properties of any PopupMenu objects you create.
 this.myName = myName;

 // Manage what gets lit and shown when.
 this.showTimer = 0;
 this.hideTimer = 0;
 this.showDelay = 0;
 this.hideDelay = 500;
 this.showMenu = '';

 // 'menu': the main data store, contains subarrays for each menu e.g. pMenu.menu['root'][];
 this.menu =  new Array();
 // litNow and litOld arrays control what items get lit in the hierarchy.
 this.litNow = new Array();
 this.litOld = new Array();

 // The item the mouse is currently over. Used by click processor to help NS4.
 this.overM = 'root';
 this.overI = 0;

 // The active menu and next item to which addItem() will assign its results. startMenu() sets
 // these automatically, set them manually if you want to call addItem() yourself, e.g.:
 // actMenu = 'root'; nextItem = 5; addItem('Another root menu item'...);
 this.actMenu = '';
 this.nextItem = 1;

 // Functions to create and manage the menu.
 this.over = popOver;
 this.changeCol = popChangeCol;
 this.out = popOut;
 this.click = popClick;
 this.clearLyr = popClearLyr;
 this.startMenu = popStartMenu;
 this.addItem = popAddItem;
 this.getHTML = popGetHTML;
 this.update = popUpdate;
 this.position = popPosition;
}


















var hBar = new ItemStyle(95, 0, '', 0, 3, '', '#006600', 'itemText', 'itemText', '', '',
 null, null);

var subM = new ItemStyle(22, 0, '', -15, 3, '#009900', '#006600', 'itemHover', 'itemHover',
 'itemBorder', 'itemBorder', null, null);





var pMenu = new PopupMenu('pMenu');
with (pMenu)
{

startMenu('root', false, 0, 98, 25, hBar);
addItem('&nbsp; About Us', 'mAbout', 'sm:', '');
addItem('&nbsp; Services', 'mServices', 'sm:', '');
addItem('&nbsp; Healthcare Consulting', 'mHC', 'sm:', '', 200);
addItem('&nbsp; Solutions In Healthcare', 'mSolutions', 'sm:', '', 210);
addItem('&nbsp; Newsletter', '/Newsletter.html', '', '', 120);
addItem('&nbsp; Links', '/FavoriteLinks.html', '');

startMenu('mAbout', true, 0, 25, 180, subM);
addItem('Qualifications Experience', '/QualificationsExperience.html', '');
addItem('Corporate Mission', '/CorporateMission.html', '');
addItem('Corporate Values', '/CorporateValues.html', '');

startMenu('mServices', true, 0, 25, 180, subM);
addItem('Strategic Planning', '/StrategicPlanning.html', '', '');
addItem('Strategic Management', '/StrategicManagememt.html', '');
addItem('Rural Healthcare Network Development and Implementation', '/Network.html', '', '', 50);
addItem('Performance Quality Improvement', '/PerformanceQualityImprovement.html', '');
addItem('Risk Management', '/RiskManagement.html', '');

startMenu('mHC', true, 0, 25, 185, subM);
addItem('&nbsp;When to Call a Consultant', '/HealthCareConsultantWhen.html', '');
addItem('&nbsp;Working With Your Consultant', '/HealthCareConsultantWhy.html', '');

startMenu('mSolutions', true, 0, 25, 180, subM);
addItem('Training Modules', '/Training.html', '');
addItem('Sample Tools and Forms', '/Tools.html', '');
addItem('Online Learning', 'http://coursework.ddbainbridgeassoc.com/', '');

}



pMenu.onclick = function() { with (this)
{
 // Do actions depending on the item that the mouse was over at the time of the click.
 // You may with to use nested IFs or 'switch' statements etc. if you're familiar with JS.
 if (overM == 'root' && overI == 1)  location.href = '/AboutUS.html';
 if (overM == 'root' && overI == 2)  location.href = '/Services.html';
 if (overM == 'root' && overI == 3)  location.href = '/HealthcareConsulting.html';
 if (overM == 'root' && overI == 4)  location.href = '/SolutionsinHealthCare.html';
}}




var popOldOL = window.onload;

window.onload = new Function('if (popOldOL) popOldOL(); pMenu.update()');
window.onresize = new Function('ns4BugCheck(); pMenu.position()');
window.onscroll = new Function('pMenu.position()');

if (isNS4) document.captureEvents(Event.CLICK);
document.onclick = new Function('evt', 'pMenu.click(); ' +
 'if (isNS4) return document.routeEvent(evt)');



// A small function that refreshes NS4 on horizontal resize, called above.
var origWinWidth = window.innerWidth;
function ns4BugCheck()
{
 if (isNS4 && origWinWidth != window.innerWidth) location.reload()
}

// Activate the onscroll event for NS browsers.
if (!isIE)
{
 var nsScrollX = page.scrollX(), nsScrollY = page.scrollY();
 setInterval('if (nsScrollY!=pageYOffset || nsScrollX!=pageYOffset) ' +
  '{ nsScrollX=pageXOffset; nsScrollY=pageYOffset; window.onscroll() }', 50);
}


