import { useRef, useState } from "react"
import { analyzeVoicePhishing, transcribeAudio } from "../api/secureiq"

export function useVoiceRecorder(options = {}) {
  const { mode = "transcribe", onTranscript, onAnalysis, requestPayload } = options
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  async function startRecording() {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm",
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach((track) => track.stop())

        setIsTranscribing(true)
        try {
          if (mode === "analyze") {
            const result = await analyzeVoicePhishing(audioBlob, requestPayload ? requestPayload() : {})
            if (result?.transcribed_text && onTranscript) {
              onTranscript(result.transcribed_text)
            }
            if (onAnalysis) {
              onAnalysis(result)
            }
          } else {
            const res = await transcribeAudio(audioBlob, "chat")
            if (res.data?.text && onTranscript) {
              onTranscript(res.data.text)
            }
          }
        } catch (err) {
          setError(mode === "analyze" ? "Voice analysis failed. Check OpenAI key." : "Transcription failed. Check OpenAI key.")
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start(250)
      setIsRecording(true)
    } catch (err) {
      setError("Microphone access denied.")
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  function toggleRecording() {
    if (isRecording) stopRecording()
    else startRecording()
  }

  return {
    isRecording,
    isTranscribing,
    error,
    toggleRecording,
    startRecording,
    stopRecording,
  }
}
