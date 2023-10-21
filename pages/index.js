import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';

export default function Home() {

  const [userInput, setUserInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      "message": "Hi there! How can I help?",
      "type": "apiMessage"
    }
  ]);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current.focus();
  }, []);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [...prevMessages, { "message": "Oops! There seems to be an error. Please try again.", "type": "apiMessage" }]);
    setLoading(false);
    setUserInput("");
  }

  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault(); // Handle form submission without triggering fullpage reload

    if (userInput.trim() === "") {
      return;
    }


    setMessages((prevMessages) => [...prevMessages, { "message": userInput, "type": "userMessage" }]);
    
    messages.forEach((message, index) => {
      // console.log(`Message ${index + 1}: ${message.message}, Type: ${message.type}`);
      console.log(`Loading: ${loading} Index ${index}: ${messages.length - 1}, Type: ${message.type}`);
    }); 
    console.log('user: ', userInput)
    

    // Send user question and history to API http://Docker-chatbot-load-balancer-383792909.ap-southeast-1.elb.amazonaws.com 
    // http://127.0.0.1:5050/
    // https://dockerchatbot.ucsiapp.com
    async function fetchData() {
      // Reset user input
      setUserInput("");
      setLoading(true);
      const response = await fetch("https://dockerchatbot.ucsiapp.com", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userInput, messages: messages}),
      });
      console.log(`loading: ${loading}`)

      if (!response.ok) {
        handleError();
        return;
    }

    
    let temp_counter = 0;
    const reader = response.body.getReader(); //Binary text reader
    const decoder = new TextDecoder("utf-8");
    
    // Define a function to read and log the chunks
    async function readAndLogChunks() {

      const { value, done } = await reader.read();
      const decodedChunk = decoder.decode(value);
          if (done) {
          temp_counter += 1
          if (temp_counter === 1){
            console.log("The stream is finished!");
            reader.releaseLock();
            return;
        }}
        console.log(decodedChunk);

        

        // Update your messages state variable with the chunk
        setMessages((prevMessages) => {
          // Get a copy of your previous messages
          const newMessages = [...prevMessages];

          // Check if the last message is from the API
          if (newMessages[newMessages.length - 1].type === "apiMessage") {
            // Append the chunk to the last message
            newMessages[newMessages.length - 1].message = decodedChunk;
            
            
          } else {
            // Create a new message with the chunk
            newMessages.push({
              message: decodedChunk,
              type: "apiMessage",
            });
          }
          // console.log("newMessages returned")

          // Return the updated messages
          return newMessages;
        });


        // Recursively call the function to read the next chunk
        readAndLogChunks();
      }

      // Call the function to start reading and logging
      readAndLogChunks();
      };
      await fetchData()
      setLoading(false);
       
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if(!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Keep history in sync with messages
  useEffect(() => {
    if (messages.length >= 3) {
      setHistory([[messages[messages.length - 2].message, messages[messages.length - 1].message]]);
    }
    }, [messages])

  return (
    <>
      <Head>
        <title>UCSI</title>
        <meta name="description" content="UTP UCS-Interactive" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/utpicon.png"/>
      </Head>
    <div className={styles.topnav}>
      <div className = {styles.navlogo}>
        <a href="/" className = {styles.homebutton}><img src= "/utplogo.svg" width = "100"></img>UCSI</a>
      </div>
    <div className = {styles.navlinks}>
    <a href="https://ucs.utp.edu.my/knowledgebase/" target="_blank">Knowledge base</a>
    <a href="https://ucs.utp.edu.my/support/" target="_blank">Support</a>
    </div>
</div>
      <main className={styles.main}>
      <div className = {styles.cloud}>
        <div ref={messageListRef} className = {styles.messagelist}>
        {messages.map((message, index) => {
          return (
            // The latest message sent by the user will be animated while waiting for a response
              <div key = {index} className = {message.type === "userMessage" && loading && index === messages.length - 1 ? styles.usermessagewaiting : message.type === "apiMessage" ? styles.apimessage : styles.usermessage}>
                {/* Display the correct icon depending on the message type */}
                {message.type === "apiMessage" ? <Image src = "/utpicon.png" alt = "AI" width = "30" height = "30" className = {styles.boticon} priority = {true} /> : <Image src = "/usericon.png" alt = "Me" width = "30" height = "30" className = {styles.usericon} priority = {true} />}
              <div className = {styles.markdownanswer}>
                {/* Messages are being rendered in Markdown format */}
                <ReactMarkdown linkTarget = {"_blank"}>{message.message}</ReactMarkdown>
                </div>
              </div>
          )
        })}
        </div>
            </div>
           <div className={styles.center}>
            
            <div className = {styles.cloudform}>
           <form onSubmit = {handleSubmit}>
          <textarea 
          disabled = {loading}
          onKeyDown={handleEnter}
          ref = {textAreaRef}
          autoFocus = {false}
          rows = {1}
          maxLength = {512}
          type="text" 
          id="userInput" 
          name="userInput" 
          placeholder = {loading? "Waiting for response..." : "Type your question..."}  
          value = {userInput} 
          onChange = {e => setUserInput(e.target.value)} 
          className = {styles.textarea}
          />
            <button 
            type = "submit" 
            disabled = {loading}
            className = {styles.generatebutton}
            >
            {loading ? <div className = {styles.loadingwheel}><CircularProgress color="inherit" size = {20}/> </div> : 
            // Send icon SVG in input field
            <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
            <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
          </svg>}
            </button>
            </form>
            </div>
            <div className = {styles.footer}>
            <p>Built by <a href="https://axelcyber.com" target="_blank">AxelCyber</a>.</p>
            {/* <p id="print"></p> */}
            </div>
        </div>
        <script src="https://cdn.botpress.cloud/webchat/v0/inject.js"></script>
        <script src="https://mediafiles.botpress.cloud/5508ca1c-dee1-4ef2-8108-994b7160349c/webchat/config.js" defer></script>
      </main>
    </>
  )
}
