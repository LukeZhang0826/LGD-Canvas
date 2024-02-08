// src/Canvas.js
import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import './Canvas.css';

const Canvas = () => {
  const [rectangles, setRectangles] = useState([]);
  const [inputSentence, setInputSentence] = useState('');
  const [wordButtons, setWordButtons] = useState([]);
  const textareaRef = useRef(null);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    let isBright = true;
    while (isBright) {
      color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      isBright = isColorTooBright(color);
    }
    return color;
  };

  const isColorTooBright = (color) => {
    const hex = color.substring(1); // Remove the #
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155; // Adjust the threshold as needed
  };

  const handleWordButtonClick = (color, word) => {
    // Automatically add a rectangle upon button click
    const newRectangle = {
      id: Math.random(),
      width: 100,
      height: 100,
      x: Math.random() * 400, // Random x position within canvas
      y: Math.random() * 400, // Random y position within canvas
      color: color,
      word: word, // Store the corresponding word
    };

    setRectangles((prevRectangles) => [...prevRectangles, newRectangle]);
  };

  const handleRemoveRectangle = (id) => {
    setRectangles((prevRectangles) => prevRectangles.filter((r) => r.id !== id));
  };

  const handleInputChange = (event) => {
    const sentence = event.target.value;
    setInputSentence(sentence);
    if (textareaRef.current && event.target.value.trim() !== '') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    } else {
      // Set a fixed height if the input string is empty
      textareaRef.current.style.height = '24px'; // Adjust this value as needed
    }
    const words = sentence.match(/\b[a-zA-Z0-9_$'-]+\b/g) || [];
    setWordButtons(words.map(() => getRandomColor()));
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault(); // Prevent the default context menu
    handleRemoveRectangle(id);
  };

  const handleGenerateButtonClick = () => {
    if (rectangles.length === 0) {
      alert('Please drag some boxes first!');
      return;
    }

    const returnArray = []

    for (let i = 0; i < rectangles.length; i++) {
      returnArray.push(rectangles[i].word)
      const data = {}
      data['name'] = rectangles[i].word
      data['x'] = Math.abs(parseInt((rectangles[i].x / 512) * 64));
      data['y'] = Math.abs(parseInt((rectangles[i].y / 512) * 64));
      data['width'] = Math.abs(parseInt((rectangles[i].width / 512) * 64));
      data['height'] = Math.abs(parseInt((rectangles[i].height / 512) * 64));

      returnArray.push(data)
    }
    console.log(returnArray, inputSentence)
  };

  const renderWordButtons = () => {
    const words = inputSentence.match(/\b[a-zA-Z0-9_$'-]+\b/g) || [];
    return words.map((word, index) => (
      <button
        key={index}
        style={{ backgroundColor: wordButtons[index] }}
        onClick={() => handleWordButtonClick(wordButtons[index], word)}
        className="text-white px-4 py-2 rounded-md cursor-pointer font-bold text-base transition duration-100 hover:bg-green-600 transform hover:scale-105"
      >
        {word}
      </button>
    ));
  };

  const handleDragStop = (id, e, d) => {
    setRectangles((prevRectangles) =>
      prevRectangles.map((r) => (r.id === id ? { ...r, x: d.x, y: d.y } : r))
    );
  };

  const handleResize = (id, direction, ref, delta, position) => {
    setRectangles((prevRectangles) =>
      prevRectangles.map((r) =>
        r.id === id
          ? {
              ...r,
              width: ref.offsetWidth,
              height: ref.offsetHeight,
              ...position,
            }
          : r
      )
    );
  };

  return (
    <div className="w-[90%] md:w-[60%] mx-auto flex flex-col items-center gap-8 py-16">
      <div className="w-full shadow-sm ring-1 ring-inset ring-gray-300 rounded-xl transition-all px-6 py-4 flex dark:ring-gray-500">
        <div className="flex flex-col justify-center items-center w-full">
          <textarea
            ref={textareaRef}
            type="text"
            placeholder="Enter a sentence"
            value={inputSentence}
            onChange={handleInputChange}
            className="outline-none bg-transparent w-full resize-none overflow-hidden flex items-center h-6 dark:text-gray-100"
          />
          {wordButtons.length !== 0 && (
            <div className="mt-4">
              <div className="block overflow-none space-y-2 space-x-2">
                {renderWordButtons()}
              </div>
            </div>
          )}
        </div>
        <div className="ml-4 flex items-center">
          <button className="bg-gray-900 text-gray-50 px-4 py-2 rounded-xl hover:bg-gray-500 duration-100 hover:scale-105 font-bold dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"  onClick={handleGenerateButtonClick}>
            Generate
          </button>
        </div>
      </div>
      <div className="canvas w-[512px] h-[512px] border-2 border-solid border-gray-900 relative mx-auto dark:border-gray-300">
        {rectangles.map((rectangle) => (
          <Rnd
            key={rectangle.id}
            className="border-2 border-solid border-gray-900 dark:border-gray-300"
            size={{ width: rectangle.width, height: rectangle.height }}
            position={{ x: rectangle.x, y: rectangle.y }}
            bounds=".canvas"
            onDragStop={(e, d) => handleDragStop(rectangle.id, e, d)}
            onResize={(e, direction, ref, delta, position) =>
              handleResize(rectangle.id, direction, ref, delta, position)
            }
            onContextMenu={(e) => handleContextMenu(e, rectangle.id)}
          >
            <div
                className="flex items-center justify-center relative text-base font-normal text-gray-100 font-bold text-sm"
              style={{ backgroundColor: rectangle.color, border: `2px solid ${rectangle.color}` }}
            >
              {rectangle.word}
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
};

export default Canvas;
