import React, { useState, useRef, useEffect } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../../wavtools';

interface VoiceChatButtonProps {
  apiKey: string;
}

/**
   * Ask user for API Key
   */
const apiKey = localStorage.getItem('tmp::voice_api_key') ||
  process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
  prompt('OpenAI API Key') ||
  '';
if (apiKey !== '') {
localStorage.setItem('tmp::voice_api_key', apiKey);
}


export default function VoiceChatButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const clientRef = useRef<RealtimeClient | null>(null);
  const wavRecorderRef = useRef<WavRecorder | null>(null);
  const wavStreamPlayerRef = useRef<WavStreamPlayer | null>(null);

  const catPrompt = "You are an AI that responds ONLY with cat sounds written phonetically. Never describe the sounds - make them directly. Use only these vocalizations:\n\n" +
"Basic Sounds:\n" +
"* Meow: \"mrow\", \"meow\", \"miaow\"\n" +
"* Short meows: \"mew\", \"miu\"\n" +
"* Questioning: \"mrrrp?\", \"prrrp?\"\n" +
"* Purring: \"prrrrrrrrr\", \"rrrrrrrr\"\n" +
"* Trills: \"brrrrup\", \"prrrrup\"\n" +
"* Happy: \"prrp-prrp-prrp\"\n" +
"* Angry: \"hssssssss\", \"MROWWW\"\n" +
"* Distressed: \"yowwwwl\", \"MRRROWWW\"\n" +
"* Chattering: \"ek-ek-ek\"\n" +
"* Disappointed: \"mrrrrrr\"\n" +
"* Demanding: \"MEOW\", \"MROW\"\n" +
"* Sleepy: \"mrrrrmmm\"\n\n" +
"Rules:\n" +
"1. ONLY output the phonetic cat sounds - never describe them\n" +
"2. Use capitalization for volume\n" +
"3. Use letter repetition for duration\n" +
"4. Use punctuation for tone:\n" +
"   * ? for questions\n" +
"   * ! for excitement\n" +
"   * ... for uncertainty";

  useEffect(() => {
    wavRecorderRef.current = new WavRecorder({ sampleRate: 24000 });
    wavStreamPlayerRef.current = new WavStreamPlayer({ sampleRate: 24000 });
    clientRef.current = new RealtimeClient({
      apiKey,
      dangerouslyAllowAPIKeyInBrowser: true,
    });
    clientRef.current.updateSession({
      instructions: catPrompt
    });

    return () => {
      disconnectConversation();
    };
  }, [apiKey]);

  const connectConversation = async () => {
    if (!clientRef.current || !wavRecorderRef.current || !wavStreamPlayerRef.current) return;

    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    try {
      setIsConnected(true);
      await wavRecorder.begin();
      await wavStreamPlayer.connect();
      await client.connect();

      client.on('conversation.updated', async ({ item, delta }: any) => {
        if (delta?.audio) {
          wavStreamPlayer.add16BitPCM(delta.audio, item.id);
        }
      });

      client.sendUserMessageContent([{ type: 'input_text', text: 'Hello!' }]);
    } catch (error) {
      console.error('Error connecting:', error);
      setIsConnected(false);
    }
  };

  const disconnectConversation = async () => {
    if (!clientRef.current || !wavRecorderRef.current || !wavStreamPlayerRef.current) return;

    try {
      setIsConnected(false);
      setIsRecording(false);
      clientRef.current.disconnect();
      await wavRecorderRef.current.end();
      await wavStreamPlayerRef.current.interrupt();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const toggleRecording = async () => {
    if (!clientRef.current || !wavRecorderRef.current) return;

    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;

    try {
      if (isRecording) {
        setIsRecording(false);
        await wavRecorder.pause();
        client.createResponse();
      } else {
        setIsRecording(true);
        await wavRecorder.record((data) => client.appendInputAudio(data.mono));
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      setIsRecording(false);
    }
  };

  return (
    <button
      onClick={isConnected ? toggleRecording : connectConversation}
      className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
    >
      {isConnected ? (isRecording ? 'Stop Recording' : 'Start Recording') : 'Start Voice Chat'}
    </button>
  );
}
