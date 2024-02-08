import React, { useState } from 'react';
import Canvas from './Canvas';
import { Switch } from '@headlessui/react'

function App() {
  const [enabled, setEnabled] = useState(false)
  return (
    <main className={`w-screen h-screen ${enabled ? "" : "dark"}`}>
      <div className="h-full w-full dark:bg-gray-900 overflow-auto">
        <Canvas />
      </div>
      <div className="absolute top-5 left-6">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={`${enabled ? 'bg-purple-400' : 'bg-purple-700'}
            relative inline-flex h-[24px] w-[48px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75`}
        >
          <span className="sr-only">Use setting</span>
          <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-6' : 'translate-x-0'}
              pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
          />
        </Switch>
      </div>
    </main>
  );
}

export default App;
