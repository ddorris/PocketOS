# Solitaire (App1) Development Plan

## Overview
Classic Klondike Solitaire implementation for PocketOS using the sprite sheet system, following the established architecture patterns from App2 (Sudoku) and App3 (DinoTiles).

---

## User Playtesting Feedback

### Round 1 - January 18, 2026

**1. Card Size & Spacing** ✅ FIXED
- **Issue:** Playing cards could be larger with tighter spacing between stacks
- **Fixed:** Max card width 100px with 8px gaps

**2. Drop Zone Hit Testing** ✅ FIXED
- **Issue:** Dragging onto a pile only validates the empty pile area
- **Fixed:** Drop zones now include full cascade area of top card

**3. Undo Card State Bug** ✅ FIXED
- **Issue:** Undo showed card back instead of face-up
- **Fixed:** Proper face-up state tracking during undo

**4. Stock Click Auto-Play** ✅ FIXED
- **Issue:** Stock card only auto-played to foundation
- **Fixed:** Now tries foundation first, then rightmost tableau

**5. Single-Click Auto-Play** ✅ FIXED
- **Issue:** Only double-click moved cards automatically
- **Fixed:** Single click auto-plays to best move

### Round 2 - January 18, 2026

**1. Drop Zone Highlight Visual** ✅ FIXED
- **Issue:** Red/green highlight only shows empty slot area, not full pile visual area
- **Fixed:** Updated `drawPileHighlight()` to extend across full cascade area including top card location

**2. Multi-Card Cascade Selection** ✅ FIXED
- **Issue:** Can only select topmost card; can't select intermediate face-up cards in cascade
- **Fixed:** Updated `hitTest()` to return cardCount, `startDrag()` uses cardCount for multi-card sequences

**3. Auto-Play Sensitivity** ✅ FIXED
- **Issue:** Auto-play triggered on mousePressed, preventing drag consideration
- **Fixed:** Deferred drag to mouseDragged, auto-play only on mouseReleased with <15px movement

**4. Stock Pile Drag Misalignment** ✅ FIXED
- **Issue:** Drag preview misaligned from cursor on waste pile cards
- **Fixed:** Set cascadeOffset=0 for stock, waste, and foundation piles (was defaulting to 25)

### Round 3 - January 19, 2026

**1. Card Spacing Reduction**
- **Issue:** Cards could be even larger with tighter spacing between tableau stacks
- **Current:** cardGap = 8px
- **Expected:** Reduce to 4-6px for maximum card size on mobile screens
- **Priority:** Medium (mobile UX optimization)

**2. Stock & Foundation Position Swap**
- **Issue:** Right-handed iPhone users struggle with stock pile on left
- **Current:** Stock/waste on top left, foundations on top right
- **Expected:** Stock/waste on top right, foundations on top left (better thumb access)
- **Priority:** High (mobile ergonomics)

**3. Foundation Suit Assignment**
- **Issue:** Foundations pre-assigned to specific suits, not standard Klondike rules
- **Current:** Each foundation slot shows suit emoji placeholder
- **Expected Behavior:**
  - Empty foundation slots show 'A' (Ace) placeholder
  - First Ace placed on slot assigns that suit to the foundation
  - Subsequent cards must match assigned suit
  - Auto-play Aces to first available (unassigned) foundation from left
- **Priority:** High (game rule accuracy)

**4. Foundation Card Dragging**
- **Issue:** Cards locked in foundations, can't be moved back to tableau
- **Current:** Foundations not in draggable piles array
- **Expected:** Allow dragging top card from foundation to tableau (recovery strategy for savvy players)
- **Priority:** Medium (advanced gameplay feature)

**5. Winnability & Dead-End Detection**
- **Issue:** No validation that generated deals are winnable; no detection of dead-end states
- **Current:** Random shuffle with no winnability check
- **Expected:**
  - Algorithm to validate deal is winnable before game start
  - Detect when player has no valid moves (dead-end detection)
  - Notify player when stuck vs when won
- **Priority:** High (game quality, prevents frustration)

**6. Victory Screen Button Overlap**
- **Issue:** Victory screen covers bottom buttons, buttons cut off by iPhone rounded edge
- **Current:** Buttons drawn at bottom, victory screen draws over them
- **Expected:** Draw buttons on top of victory screen, center horizontally, move up to avoid screen edge
- **Priority:** Medium (UI polish)

---

## Sprite Sheet Analysis: Solitaire.png

### Layout
- **Rows 1-4:** Standard 52 playing cards (13 cards × 4 suits)
  - Row 1: Spades (A-K)
  - Row 2: Hearts (A-K)
  - Row 3: Clubs (A-K)
  - Row 4: Diamonds (A-K)
- **Row 5:** Card backs and UI elements (multiple back designs, foundation/empty pile markers)
- **Row 6:** Additional backs/UI (beach scenes, card face patterns)

### Card Index Mapping
```javascript
// Card index calculation: rank + (suit * 13)
// Suits: Spades=0, Hearts=1, Clubs=2, Diamonds=3
// Ranks: A=0, 2=1, 3=2, ..., J=10, Q=11, K=12

const cardIndex = rank + (suit * 13);

// Examples:
// Ace of Spades: 0 + (0 * 13) = 0
// King of Hearts: 12 + (1 * 13) = 25
// Card backs: indices 52+
```

---

## Phase 1: Sprite Sheet Configuration & Asset Integration

### 1.1 Measure Sprite Sheet Dimensions
**Goal:** Determine exact pixel coordinates for all cards

**Tasks:**
- Measure individual card width/height in pixels
- Calculate source X coordinates (sx array) for 13 columns
- Calculate source Y coordinates (sy array) for 6 rows
- Define optimal display size (dw, dh) for rendering

### 1.2 Update InstalledApps.json
**Goal:** Configure sprite sheet for SpriteSheetSystem preloading

```json
{
  "id": 1,
  "key": "solitaire",
  "name": "Solitaire",
  "description": "A classic card game",
  "entry": "./Source/Apps/App1.js",
  "icon": "./PocketOS/Assets/Icons/App1.svg",
  "model": "./Source/Models/Solitaire.js",
  "bundle": {
    "spriteSheets": [
      {
        "key": "cards",
        "url": "./PocketOS/Assets/Cards/Solitaire.png",
        "sx": [x0, x1, x2, ...],  // 13 columns
        "sy": [y0, y1, y2, ...],  // 6 rows
        "sw": [card_width],
        "sh": [card_height],
        "cols": 13,
        "rows": 6,
        "dw": [render_width],
        "dh": [render_height]
      }
    ]
  }
}
```

---

## Phase 2: SolitaireModel - Game Logic

### 2.1 Core Data Structures
**File:** `Models/SolitaireModel.js`

```javascript
export default class SolitaireModel extends Model {
  constructor() {
    super();
    
    // 7 tableau piles (main play area)
    this.tableau = []; // Array of 7 arrays of Cards
    
    // 4 foundation piles (build up by suit A-K)
    this.foundations = [[], [], [], []]; // One per suit
    
    // Stock pile (face-down cards to draw)
    this.stock = [];
    
    // Waste pile (face-up drawn cards)
    this.waste = [];
    
    // Move history for undo
    this.moveHistory = [];
  }
  
  // Card representation
  // { suit: 0-3, rank: 0-12, faceUp: boolean, index: number }
}
```

### 2.2 Game Initialization Methods

**initializeGame()**
- Create standard 52-card deck
- Shuffle using Fisher-Yates algorithm
- Deal to tableau: 1 card to pile 1, 2 to pile 2, ..., 7 to pile 7
- Set top card of each tableau pile face-up
- Remaining 24 cards go to stock (face-down)

**shuffle(deck)**
- Fisher-Yates shuffle implementation
- Ensures random distribution

**createDeck()**
- Generate 52 card objects
- Suits: 0=Spades, 1=Hearts, 2=Clubs, 3=Diamonds
- Ranks: 0=Ace, 1-9=2-10, 10=Jack, 11=Queen, 12=King

### 2.3 Move Validation Methods

**canMoveToTableau(cards, targetPileIndex)**
- Validate tableau rules:
  - Target must be alternating color (red/black)
  - Target must be descending rank (n-1)
  - Empty tableau accepts King only
- Returns: `boolean`

**canMoveToFoundation(card, suitIndex)**
- Validate foundation rules:
  - Must be same suit
  - Must be next rank in sequence (Ace=0, then 1, 2, ..., 12)
  - Empty foundation accepts Ace only
- Returns: `boolean`

**canDrawFromStock()**
- Check if stock has cards remaining
- Returns: `boolean`

**getValidMoves()**
- Calculate all legal moves from current state
- Used for hints and auto-complete detection
- Returns: `Move[]`

### 2.4 Move Execution Methods

**moveCards(sourcePile, targetPile, cardCount)**
- Execute validated move
- Update pile states
- Record move in history for undo

**drawFromStock()**
- Move top card from stock to waste
- Flip card face-up

**recycleWaste()**
- Move all waste cards back to stock
- Reset for new draw cycle

**autoMoveToFoundation(card)**
- Attempt to move card to appropriate foundation
- Used for double-click feature

### 2.5 Game State Management

**isGameWon()**
- Check if all 4 foundations are complete (King on top)
- Returns: `boolean`

**hasValidMoves()**
- Check if any legal moves exist
- Prevents unwinnable situations
- Returns: `boolean`

**canAutoComplete()**
- Determine if all remaining moves are to foundations
- Enables victory animation trigger
- Returns: `boolean`

**getHint()**
- Suggest next optimal move (optional feature)
- Returns: `{ source, target, cards }`

---

## Phase 3: View Components

### 3.1 SolitaireCard.js
**File:** `Views/App1/SolitaireCard.js`

```javascript
import View from '../../Core/View.js';

export default class SolitaireCard extends View {
  constructor({ suit, rank, faceUp = false, sheetKey = 'cards' }) {
    super();
    this.suit = suit;       // 0-3
    this.rank = rank;       // 0-12
    this.faceUp = faceUp;
    this.sheetKey = sheetKey;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.highlighted = false;
    this.dragging = false;
  }
  
  getCardIndex() {
    // Map to sprite sheet index
    return this.rank + (this.suit * 13);
  }
  
  getBackIndex() {
    // Card back sprite index (row 5+)
    return 52; // Default back design
  }
  
  draw({ spriteSheetSystem, x, y, width, height }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    const index = this.faceUp ? this.getCardIndex() : this.getBackIndex();
    
    // Draw card sprite
    spriteSheetSystem.drawTile({
      sheetKey: this.sheetKey,
      tileIndex: index,
      dx: x,
      dy: y,
      dw: width,
      dh: height
    });
    
    // Draw highlight/drag overlay
    if (this.highlighted || this.dragging) {
      this.drawOverlay();
    }
  }
  
  drawOverlay() {
    push();
    noFill();
    strokeWeight(3);
    stroke(this.highlighted ? '#0066cc' : '#00cc66');
    rect(this.x, this.y, this.width, this.height, 4);
    pop();
  }
  
  containsPoint(mx, my) {
    return mx >= this.x && mx <= this.x + this.width &&
           my >= this.y && my <= this.y + this.height;
  }
  
  setHighlight(enabled) {
    this.highlighted = enabled;
  }
  
  setDragging(enabled) {
    this.dragging = enabled;
  }
  
  // Helper methods
  getColor() {
    // 0=Spades(black), 1=Hearts(red), 2=Clubs(black), 3=Diamonds(red)
    return (this.suit === 1 || this.suit === 3) ? 'red' : 'black';
  }
  
  isRed() {
    return this.suit === 1 || this.suit === 3;
  }
  
  isBlack() {
    return this.suit === 0 || this.suit === 2;
  }
}
```

### 3.2 SolitairePile.js
**File:** `Views/App1/SolitairePile.js`

```javascript
import View from '../../Core/View.js';
import SolitaireCard from './SolitaireCard.js';

export default class SolitairePile extends View {
  constructor({ type, x = 0, y = 0, cards = [] }) {
    super();
    this.type = type; // 'tableau' | 'foundation' | 'stock' | 'waste'
    this.x = x;
    this.y = y;
    this.cards = cards; // Array of SolitaireCard
    this.cardWidth = 0;
    this.cardHeight = 0;
    this.cascadeOffset = 25; // Vertical offset for tableau cascade
  }
  
  calculateCardPositions() {
    // Calculate positions based on pile type
    const positions = [];
    
    if (this.type === 'tableau') {
      // Cascade vertically
      this.cards.forEach((card, i) => {
        positions.push({
          x: this.x,
          y: this.y + (i * this.cascadeOffset),
          card
        });
      });
    } else {
      // Stack (only show top card)
      if (this.cards.length > 0) {
        positions.push({
          x: this.x,
          y: this.y,
          card: this.cards[this.cards.length - 1]
        });
      }
    }
    
    return positions;
  }
  
  draw({ spriteSheetSystem, cardWidth, cardHeight }) {
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    
    if (this.cards.length === 0) {
      this.drawEmptySlot();
      return;
    }
    
    const positions = this.calculateCardPositions();
    
    positions.forEach(({ x, y, card }) => {
      card.draw({
        spriteSheetSystem,
        x,
        y,
        width: cardWidth,
        height: cardHeight
      });
    });
  }
  
  drawEmptySlot() {
    push();
    noFill();
    stroke(100, 100, 100, 100);
    strokeWeight(2);
    rect(this.x, this.y, this.cardWidth, this.cardHeight, 4);
    
    // Draw pile type indicator
    if (this.type === 'foundation') {
      // Draw suit symbol
      fill(150, 150, 150, 80);
      textAlign(CENTER, CENTER);
      textSize(24);
      text('♠♥♣♦'[this.foundationSuit] || '', 
           this.x + this.cardWidth / 2, 
           this.y + this.cardHeight / 2);
    }
    pop();
  }
  
  hitTest(mx, my) {
    // Return topmost card under cursor for tableau (or specific card in cascade)
    if (this.type === 'tableau') {
      const positions = this.calculateCardPositions();
      // Check from bottom to top (reverse order)
      for (let i = positions.length - 1; i >= 0; i--) {
        const { card, x, y } = positions[i];
        if (card.faceUp && 
            mx >= x && mx <= x + this.cardWidth &&
            my >= y && my <= y + this.cardHeight) {
          return { card, cardIndex: i };
        }
      }
    } else {
      // For other piles, only top card is interactive
      const topCard = this.getTopCard();
      if (topCard && topCard.containsPoint(mx, my)) {
        return { card: topCard, cardIndex: this.cards.length - 1 };
      }
    }
    
    return null;
  }
  
  getTopCard() {
    return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
  }
  
  canAcceptDrop(cards, model) {
    if (this.type === 'tableau') {
      return model.canMoveToTableau(cards, this.pileIndex);
    } else if (this.type === 'foundation') {
      return cards.length === 1 && model.canMoveToFoundation(cards[0], this.foundationSuit);
    }
    return false;
  }
  
  addCard(card) {
    this.cards.push(card);
  }
  
  removeCards(count) {
    return this.cards.splice(this.cards.length - count, count);
  }
}
```

### 3.3 SolitaireGame.js
**File:** `Views/App1/SolitaireGame.js`

```javascript
import View from '../../Core/View.js';
import SolitairePile from './SolitairePile.js';
import SolitaireCard from './SolitaireCard.js';
import Button from '../Button.js';

export default class SolitaireGame extends View {
  constructor({ model, spriteSheetSystem, isEnabled }) {
    super();
    this.model = model;
    this.spriteSheetSystem = spriteSheetSystem;
    this.isEnabled = isEnabled || (() => true);
    
    // Layout constants
    this.appDockHeight = 120;
    this.padding = 20;
    this.cardGap = 15;
    this.cardWidth = 70;
    this.cardHeight = 100;
    
    // Piles
    this.tableau = [];      // 7 tableau piles
    this.foundations = [];  // 4 foundation piles
    this.stock = null;      // Stock pile
    this.waste = null;      // Waste pile
    
    // Drag state
    this.dragSource = null; // { pile, cards, startX, startY, cardIndex }
    this.dragOffset = { x: 0, y: 0 };
    this.dragCurrentPos = { x: 0, y: 0 };
    
    // UI Controls
    this.newGameButton = null;
    this.undoButton = null;
    
    this.initializePiles();
    this.createButtons();
  }
  
  initializePiles() {
    // Create pile views from model state
    this.syncPilesWithModel();
  }
  
  syncPilesWithModel() {
    // Tableau piles
    this.tableau = this.model.tableau.map((cards, i) => {
      const cardViews = cards.map(c => new SolitaireCard(c));
      return new SolitairePile({
        type: 'tableau',
        cards: cardViews,
        pileIndex: i
      });
    });
    
    // Foundation piles
    this.foundations = this.model.foundations.map((cards, i) => {
      const cardViews = cards.map(c => new SolitaireCard(c));
      return new SolitairePile({
        type: 'foundation',
        cards: cardViews,
        foundationSuit: i
      });
    });
    
    // Stock
    const stockCards = this.model.stock.map(c => new SolitaireCard(c));
    this.stock = new SolitairePile({
      type: 'stock',
      cards: stockCards
    });
    
    // Waste
    const wasteCards = this.model.waste.map(c => new SolitaireCard(c));
    this.waste = new SolitairePile({
      type: 'waste',
      cards: wasteCards
    });
  }
  
  createButtons() {
    this.newGameButton = new Button({
      label: 'New Game',
      width: 100,
      height: 35,
      bgColor: '#565758',
      hoverColor: '#6a6a6c',
      onClick: () => this.newGame()
    });
    
    this.undoButton = new Button({
      label: 'Undo',
      width: 80,
      height: 35,
      bgColor: '#565758',
      hoverColor: '#6a6a6c',
      onClick: () => this.undo()
    });
  }
  
  calculateLayout() {
    const w = width;
    const h = height - this.appDockHeight;
    
    // Calculate card size based on available space
    const availableWidth = w - (this.padding * 2);
    const maxCardWidth = (availableWidth - (this.cardGap * 6)) / 7;
    this.cardWidth = Math.min(70, maxCardWidth);
    this.cardHeight = this.cardWidth * 1.4;
    
    // Foundation row (top)
    const foundationY = this.appDockHeight + this.padding;
    const foundationStartX = w - (this.padding + (this.cardWidth + this.cardGap) * 4);
    this.foundations.forEach((pile, i) => {
      pile.x = foundationStartX + i * (this.cardWidth + this.cardGap);
      pile.y = foundationY;
    });
    
    // Stock and Waste (top left)
    this.stock.x = this.padding;
    this.stock.y = foundationY;
    this.waste.x = this.padding + this.cardWidth + this.cardGap;
    this.waste.y = foundationY;
    
    // Tableau row (below stock/foundation)
    const tableauY = foundationY + this.cardHeight + this.padding * 2;
    this.tableau.forEach((pile, i) => {
      pile.x = this.padding + i * (this.cardWidth + this.cardGap);
      pile.y = tableauY;
    });
    
    // Buttons (bottom right)
    this.newGameButton.x = w - this.padding - this.newGameButton.width;
    this.newGameButton.y = h - this.padding - this.newGameButton.height;
    this.undoButton.x = this.newGameButton.x - this.undoButton.width - 10;
    this.undoButton.y = this.newGameButton.y;
  }
  
  draw() {
    if (!this.isEnabled()) return;
    
    // Background
    push();
    noStroke();
    fill(34, 139, 34); // Solitaire green
    rect(0, this.appDockHeight, width, height - this.appDockHeight);
    pop();
    
    this.calculateLayout();
    
    // Draw piles
    const drawConfig = {
      spriteSheetSystem: this.spriteSheetSystem,
      cardWidth: this.cardWidth,
      cardHeight: this.cardHeight
    };
    
    this.tableau.forEach(pile => pile.draw(drawConfig));
    this.foundations.forEach(pile => pile.draw(drawConfig));
    this.stock.draw(drawConfig);
    this.waste.draw(drawConfig);
    
    // Draw drag preview
    if (this.dragSource) {
      this.drawDragPreview();
    }
    
    // Draw buttons
    this.newGameButton.draw();
    this.undoButton.draw();
  }
  
  drawDragPreview() {
    const { cards } = this.dragSource;
    const { x, y } = this.dragCurrentPos;
    
    push();
    tint(255, 200); // Semi-transparent
    cards.forEach((card, i) => {
      card.draw({
        spriteSheetSystem: this.spriteSheetSystem,
        x: x,
        y: y + i * 25,
        width: this.cardWidth,
        height: this.cardHeight
      });
    });
    pop();
  }
  
  mousePressed(mx, my) {
    // Check buttons first
    if (this.newGameButton.checkClick(mx, my)) return true;
    if (this.undoButton.checkClick(mx, my)) return true;
    
    // Check stock click
    if (this.stock.hitTest(mx, my)) {
      this.handleStockClick();
      return true;
    }
    
    // Check for card drag start
    this.startDrag(mx, my);
    return false;
  }
  
  mouseDragged(mx, my) {
    if (this.dragSource) {
      this.dragCurrentPos = {
        x: mx - this.dragOffset.x,
        y: my - this.dragOffset.y
      };
      return true;
    }
    return false;
  }
  
  mouseReleased(mx, my) {
    if (this.dragSource) {
      this.completeDrag(mx, my);
      return true;
    }
    return false;
  }
  
  startDrag(mx, my) {
    // Check all piles for hit
    const allPiles = [...this.tableau, ...this.foundations, this.waste];
    
    for (const pile of allPiles) {
      const hit = pile.hitTest(mx, my);
      if (hit) {
        const { card, cardIndex } = hit;
        
        // Get cards to drag (from cardIndex to end for tableau)
        const cards = pile.type === 'tableau' 
          ? pile.cards.slice(cardIndex)
          : [card];
        
        this.dragSource = {
          pile,
          cards,
          cardIndex,
          startX: pile.x,
          startY: pile.y
        };
        
        this.dragOffset = {
          x: mx - pile.x,
          y: my - (pile.y + cardIndex * pile.cascadeOffset)
        };
        
        this.dragCurrentPos = { x: mx - this.dragOffset.x, y: my - this.dragOffset.y };
        
        cards.forEach(c => c.setDragging(true));
        break;
      }
    }
  }
  
  completeDrag(mx, my) {
    const { pile: sourcePile, cards, cardIndex } = this.dragSource;
    
    // Find target pile
    const targetPile = this.findPileUnderCursor(mx, my);
    
    if (targetPile && targetPile !== sourcePile && targetPile.canAcceptDrop(cards, this.model)) {
      // Valid move - update model
      this.model.moveCards(sourcePile.pileIndex, targetPile.pileIndex, cards.length);
      this.syncPilesWithModel();
    }
    
    // Clear drag state
    cards.forEach(c => c.setDragging(false));
    this.dragSource = null;
  }
  
  findPileUnderCursor(mx, my) {
    const allPiles = [...this.tableau, ...this.foundations];
    
    for (const pile of allPiles) {
      if (mx >= pile.x && mx <= pile.x + this.cardWidth &&
          my >= pile.y && my <= pile.y + this.cardHeight) {
        return pile;
      }
    }
    
    return null;
  }
  
  handleStockClick() {
    if (this.model.canDrawFromStock()) {
      this.model.drawFromStock();
    } else {
      this.model.recycleWaste();
    }
    this.syncPilesWithModel();
  }
  
  newGame() {
    this.model.initializeGame();
    this.syncPilesWithModel();
  }
  
  undo() {
    this.model.undo();
    this.syncPilesWithModel();
  }
}
```

---

## Phase 4: Drag & Drop UX

### 4.1 Mouse/Touch Interaction Flow

**mousePressed(mx, my)**
1. Check if click is on UI buttons (New Game, Undo)
2. Check if click is on stock pile (draw card)
3. Check all piles for card hit (start drag if valid)
4. Store drag source, cards, and offset

**mouseDragged(mx, my)**
1. Update drag preview position
2. Calculate cursor offset from drag start
3. Render cards at new position (semi-transparent)

**mouseReleased(mx, my)**
1. Find pile under cursor
2. Validate move using model
3. If valid: update model, sync view
4. If invalid: snap back (or show error feedback)
5. Clear drag state

### 4.2 Visual Feedback

**During Drag:**
- Dragged cards rendered with transparency (tint)
- Valid drop targets highlighted with green outline
- Invalid targets highlighted with red outline (optional)

**On Drop:**
- Valid: Smooth transition animation to target
- Invalid: Snap-back animation to source

**Highlights:**
- Selected card(s): Blue outline
- Valid target: Green outline
- Hover: Subtle glow

### 4.3 Mobile Touch Support

**Alternative Input Method:**
1. First tap: Select card (highlight)
2. Second tap: Move to target (if valid)
3. Double-tap: Auto-move to foundation

**Touch Events:**
- `touchStarted()` → `mousePressed()`
- `touchMoved()` → `mouseDragged()`
- `touchEnded()` → `mouseReleased()`

---

## Phase 5: Game Rules Implementation

### 5.1 Tableau Rules

**Placement:**
- Cards must alternate color (red on black, black on red)
- Cards must be in descending rank (K, Q, J, ..., 2, A)
- Multiple cards can be moved as a sequence if they form a valid stack
- Empty tableau piles accept King only

**Example:**
```
Valid:   7♥ → 6♠ → 5♦
Invalid: 7♥ → 6♥ (same color)
Invalid: 7♥ → 5♠ (not descending by 1)
```

### 5.2 Foundation Rules

**Placement:**
- Must be same suit throughout
- Must start with Ace (rank 0)
- Must build in ascending order (A, 2, 3, ..., Q, K)
- Only one card can be moved to foundation at a time

**Example:**
```
Foundation 0 (Spades):  A♠ → 2♠ → 3♠ → ... → K♠
Foundation 1 (Hearts):  A♥ → 2♥ → 3♥ → ... → K♥
```

### 5.3 Stock/Waste Rules

**Stock (Draw Pile):**
- Face-down cards
- Click to draw 1 card to waste
- When empty, click to recycle waste back to stock

**Waste (Discard Pile):**
- Face-up cards
- Only top card can be moved
- Can move to tableau or foundation

**Draw Modes:**
- Draw 1: Move one card from stock to waste per click
- Draw 3: Move three cards (optional feature)

### 5.4 Win Condition

**Victory:**
- All 52 cards in foundations (13 cards × 4 suits)
- Each foundation has King (rank 12) on top

**Auto-Complete:**
- When only foundation moves remain, auto-play cards
- Victory animation (cards cascade off screen)

---

## Phase 6: App1.js Integration

### 6.1 Updated App Structure

**File:** `Apps/App1.js`

```javascript
import App from '../Core/App.js';
import AppInfo from '../Views/AppInfo.js';
import SolitaireModel from '../Models/SolitaireModel.js';
import SolitaireGame from '../Views/App1/SolitaireGame.js';
import SpriteSheetSystem from '../Systems/SpriteSheetSystem.js';

export default class App1 extends App {
  constructor() {
    super();
    this.model = new SolitaireModel();
    this.game = null;
  }

  setup() {
    const appInfo = this.engine.state.apps.find(app => app.id === 1);
    if (appInfo && appInfo.icon) {
      const icon = loadImage(appInfo.icon);
      this.appInfo = new AppInfo({ info: appInfo, icon });
    }

    // Get SpriteSheetSystem from engine
    const spriteSheetSystem = this.engine.systems.find(
      s => s instanceof SpriteSheetSystem
    );

    // Initialize game view
    this.game = new SolitaireGame({
      model: this.model,
      spriteSheetSystem,
      isEnabled: () => this.enabled
    });

    // Start new game
    this.model.initializeGame();
  }

  draw() {
    if (this.enabled === false) return;
    if (this.game) {
      this.game.draw();
    }
  }

  mousePressed() {
    if (!this.enabled || !this.game) return false;
    return this.game.mousePressed(mouseX, mouseY);
  }

  mouseDragged() {
    if (!this.enabled || !this.game) return false;
    return this.game.mouseDragged(mouseX, mouseY);
  }

  mouseReleased() {
    if (!this.enabled || !this.game) return false;
    return this.game.mouseReleased(mouseX, mouseY);
  }

  touchStarted() {
    return this.mousePressed();
  }

  touchMoved() {
    return this.mouseDragged();
  }

  touchEnded() {
    return this.mouseReleased();
  }

  cleanup() {
    if (this.game) {
      this.game = null;
    }
  }
}
```

---

## Phase 7: Polish & Features

### 7.1 UI Controls

**Buttons:**
- ✅ New Game: Reset and shuffle deck
- ✅ Undo: Revert last move
- ⚙️ Settings: Draw 1/3 toggle, themes

**Status Display:**
- Move counter
- Timer (optional)
- Score (Vegas mode, optional)

### 7.2 Animations

**Card Movement:**
- Smooth lerp transition from source to target (200ms)
- Ease-in-out timing function

**Card Flip:**
- Rotate animation when flipping face-up
- Scale effect for emphasis

**Victory:**
- Cards cascade up to foundations automatically
- Confetti or sparkle effect
- "You Win!" message

### 7.3 Settings & Modes

**Draw Modes:**
- Draw 1 (default): One card per click
- Draw 3: Three cards per click (harder)

**Scoring:**
- Classic: Track moves and time
- Vegas: Start with -$52, earn $5 per foundation card

**Themes:**
- Classic green felt
- Blue felt
- Custom background image

---

## Implementation Checklist

### **Phase 1: Foundation (MVP)**
- [ ] **Task 1:** Measure sprite sheet and configure InstalledApps.json
- [ ] **Task 2:** Implement SolitaireModel core data structures
- [ ] **Task 3:** Implement game initialization (shuffle, deal)
- [ ] **Task 4:** Implement move validation (tableau, foundation)
- [ ] **Task 5:** Implement game state management (win detection)

### **Phase 2: View Components**
- [ ] **Task 6:** Create SolitaireCard.js view component
- [ ] **Task 7:** Create SolitairePile.js view component
- [ ] **Task 8:** Create SolitaireGame.js orchestrator
- [ ] **Task 9:** Implement basic rendering (static layout)

### **Phase 3: Interaction**
- [ ] **Task 10:** Implement drag & drop (mouse events)
- [ ] **Task 11:** Implement stock draw and recycle
- [ ] **Task 12:** Add visual feedback (highlights, drag preview)
- [ ] **Task 13:** Update App1.js integration

### **Phase 4: Polish**
- [ ] **Task 14:** Add touch support (mobile)
- [ ] **Task 15:** Add New Game and Undo buttons
- [ ] **Task 16:** Implement double-click auto-move
- [ ] **Task 17:** Add smooth animations
- [ ] **Task 18:** Victory detection and celebration

### **Phase 5: Advanced Features**
- [ ] Draw 3 mode
- [ ] Move counter and timer
- [ ] Hint system
- [ ] Auto-complete when won
- [ ] Save/load game state
- [ ] Statistics tracking

---

## Architecture Alignment

### Follows PocketOS Patterns

**Model-View Separation:**
- ✅ SolitaireModel: Pure game logic, no p5 dependencies
- ✅ View components: Rendering and interaction only
- ✅ App1: Lifecycle orchestration

**Sprite Sheet System:**
- ✅ Configured via InstalledApps.json bundle
- ✅ Preloaded by SpriteSheetSystem
- ✅ Accessed via `engine.state.spriteSheets`

**Component Hierarchy:**
- ✅ All views extend View base class
- ✅ Model extends Model base class
- ✅ App extends App base class

**Event Flow:**
- ✅ Engine propagates p5 lifecycle events
- ✅ App delegates to Game view
- ✅ Game coordinates piles and cards

---

## Next Steps

**Ready to implement!** Start with Phase 1, Task 1: measuring the sprite sheet and configuring the bundle.

Would you like to proceed with implementation, or make adjustments to the plan?
