import React, { useMemo, useState } from 'react';
import { FaPaperPlane, FaRobot, FaTimes } from 'react-icons/fa';
import { allProducts } from './Stock';

const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://127.0.0.1:8011';

const starterPrompts = [
  'Help me shop for chicken alfredo',
  'I need milk and eggs',
  'Suggest snacks for a movie night',
];

const FoodieAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi, I can help find in-stock groceries and turn recipes into shopping suggestions.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inventory = useMemo(
    () =>
      allProducts.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        identifiers: product.identifiers || [],
        price: product.price,
        availability: product.availability,
      })),
    []
  );

  const sendMessage = async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${AGENT_API_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          inventory,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Assistant request failed');
      }

      const data = await response.json();
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: 'I could not reach the Foodie assistant service. Please make sure the agent backend is running.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open Foodie AI assistant"
        title="Open Foodie AI assistant"
        className="fixed right-4 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200"
        onClick={() => setIsOpen(true)}
      >
        <FaRobot size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30">
          <section className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-green-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-green-950">Foodie AI</h2>
                <p className="text-sm text-gray-600">Shopping suggestions only</p>
              </div>
              <button
                type="button"
                aria-label="Close Foodie AI assistant"
                title="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <FaTimes />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-green-50 px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="max-w-[70%] rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                  Thinking...
                </div>
              )}
            </div>

            <div className="border-t border-green-100 bg-white p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-green-200 px-3 py-1 text-xs text-green-800 hover:bg-green-50"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form
                className="flex items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
              >
                <textarea
                  className="min-h-12 flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  rows="2"
                  placeholder="Ask for groceries or recipe help..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  title="Send"
                  disabled={isLoading || !input.trim()}
                  className="flex h-12 w-12 items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default FoodieAI;
