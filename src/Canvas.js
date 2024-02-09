// src/Canvas.js
import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import './Canvas.css';
import axios from 'axios';
import { toast } from 'react-toastify';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

const Canvas = () => {
  const [rectangles, setRectangles] = useState([]);
  const [inputSentence, setInputSentence] = useState('');
  const [wordButtons, setWordButtons] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const textareaRef = useRef(null);

  const s3Client = new S3Client({
    region: "us-east-1", // e.g., 'us-east-1'
    credentials: {
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    },
  });

  const uploadFileToS3 = async (file) => {
    const uploadParams = {
      Bucket: "lgdimagebucket",
      Key: `${uuidv4()}_${Date.now()}`,
      Body: file,
      ContentType: 'image/png',
    };
  
    try {
      const data = await s3Client.send(new PutObjectCommand(uploadParams));
    } catch (err) {
      console.error("Error", err);
      throw err;
    }
  };

  async function fetchAndDisplayImage(returnData) {
    try {
      const response = await axios.post(process.env.REACT_APP_API_ENDPOINT, returnData, {
        responseType: 'blob'
      });
      const imageUrl = URL.createObjectURL(response.data);
      setImageUrl(imageUrl);
      uploadFileToS3(response.data);

      toast('🦄 Image Generated!', {
        position: "top-right",
        autoClose: 5000,  
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: "light",
      });
    } catch (error) {
      console.error(error);
    }
  }

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

  const handleGenerateButtonClick = async () => {
    if (rectangles.length === 0 || inputSentence.trim() === ''){
      toast.error('Add some words to the Canvas!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    const returnArray = []

    for (let i = 0; i < rectangles.length; i++) {
      const data = {}
      data['name'] = rectangles[i].word
      data['x'] = Math.abs(parseInt((rectangles[i].x / 512) * 64));
      data['y'] = Math.abs(parseInt((rectangles[i].y / 512) * 64));
      data['width'] = Math.abs(parseInt((rectangles[i].width / 512) * 64));
      data['height'] = Math.abs(parseInt((rectangles[i].height / 512) * 64));
      returnArray.push(data)
    }
    const returnData = {
      'rectangles': returnArray,
      'prompt': inputSentence
    }

    fetchAndDisplayImage(returnData);
  };

  const renderWordButtons = () => {
    const words = inputSentence.match(/\b[a-zA-Z0-9_$'-]+\b/g) || [];
    return words.map((word, index) => (
      <button
        key={index}
        style={{ backgroundColor: wordButtons[index] }}
        onClick={() => handleWordButtonClick(wordButtons[index], word)}
        className="text-white mr-2 mb-2 shadow-lg px-4 py-2 rounded-md cursor-pointer font-bold text-base transition duration-100 transform hover:scale-105"
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
      {/* {imageUrl !== "" && (
      <button className="absolute top-4 right-6 text-gray-900 dark:text-gray-200 hover:text-gray-500 dark:hover:text-gray-300 hover:scale-110 duration-200" onClick={() => setImageUrl("")}>
        <MdRestartAlt className="h-8 w-8 text-gray-900 dark:text-gray-200 duration-200"/>
      </button>
      )} */}
      <div className="w-full shadow-lg ring-1 ring-inset ring-gray-300 rounded-xl transition-all px-6 py-4 flex dark:ring-gray-500 bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col justify-center w-full ">
          <textarea
            ref={textareaRef}
            type="text"
            placeholder="Enter a sentence"
            value={inputSentence}
            onChange={handleInputChange}
            className="outline-none bg-transparent w-full resize-none overflow-hidden flex items-center h-6 dark:text-gray-100"
          />
          {wordButtons.length !== 0 && (
            <div className="mt-8">
              <div className="block overflow-none">
                {renderWordButtons()}
              </div>
            </div>
          )}
        </div>
        <div className="ml-4 flex items-center">
          {imageUrl !== "" ? (
            <button className="w-32 bg-gray-900 shadow-lg text-gray-50 px-4 py-2 rounded-xl hover:bg-gray-500 duration-200 hover:scale-105 font-bold dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"  onClick={() => setImageUrl("")}>
              Try Again
            </button>
          ) : (
            <button className="w-32 bg-gray-900 shadow-lg text-gray-50 px-4 py-2 rounded-xl hover:bg-gray-500 duration-200 hover:scale-105 font-bold dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"  onClick={handleGenerateButtonClick}>
              Generate
            </button>
          )}
        </div>
      </div>
      
      {
        imageUrl !=="" ? (
        <img id="generated-image" src={imageUrl} alt="canvas" className="bg-gray-50 shadow-2xl duration-200 dark:bg-gray-950 w-[512px] h-[512px] object-cover ring-1 ring-inset ring-gray-300 relative mx-auto dark:ring-gray-400 rounded-xl" />
        ) : (
        <div className="canvas bg-gray-50 shadow-md duration-200 dark:bg-gray-950 w-[512px] h-[512px] ring-1 ring-solid ring-gray-300 relative mx-auto dark:ring-gray-400 rounded-xl">
          {rectangles.map((rectangle) => (
            <Rnd
              key={rectangle.id}
              className="ring-1 ring-solid ring-gray-300 dark:ring-gray-400 rounded-xl overflow-hidden"
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
                  className="flex items-center justify-center relative text-base font-normal text-gray-100 font-bold text-sm "
                style={{ backgroundColor: rectangle.color, border: `2px solid ${rectangle.color}` }}
              >
                {rectangle.word}
              </div>
            </Rnd>
          ))}
        </div>
      )}
      </div>
  );
};

export default Canvas;
