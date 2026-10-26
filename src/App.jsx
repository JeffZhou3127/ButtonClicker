import { useState } from 'react'
import Button from './components/Button.jsx'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="clicker">
      <p className="eyebrow">ONE BUTTON. ENDLESS CLICKS.</p>
      <h1>Button Clicker</h1>
      <p className="description">Give the button a click. Watch your score grow.</p>

      <div className="score" role="status" aria-live="polite" aria-atomic="true">
        <span className="score-number">{count.toLocaleString()}</span>
        <span className="score-label">{count === 1 ? 'click' : 'clicks'}</span>
      </div>

      <Button
        className="click-button"
        onClick={() => setCount((current) => current + 1)}
      >
        Click me!
        <span className="click-reward">+1 per click</span>
      </Button>

      <Button
        className="reset-button"
        onClick={() => setCount(0)}
        disabled={count === 0}
      >
        Reset score
      </Button>
      <p className="hint">Every click counts.</p>
    </main>
  )
}

export default App
