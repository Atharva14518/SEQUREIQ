import os
import shutil
import tempfile

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse
from openai import OpenAI

from ai.phishing_detector import analyze_message
from database import save_phishing_analysis

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _save_temp_audio(audio: UploadFile) -> str:
    suffix = "." + audio.filename.split(".")[-1] if audio.filename and "." in audio.filename else ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        return tmp.name


def _transcribe_file(tmp_path: str, language: str):
    with open(tmp_path, "rb") as audio_file:
        return client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language,
            prompt="Indian business security context. May include technical terms, domain names, security terminology, Hindi/English mix.",
        )


@router.post("/whisper/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
    context: str = Form(default="security"),
):
    """
    Transcribe audio using OpenAI Whisper.
    Used for:
    1. Voice input in chatbot
    2. Transcribing suspicious voice messages for phishing analysis
    """
    tmp_path = None
    try:
        tmp_path = _save_temp_audio(audio)
        transcript = _transcribe_file(tmp_path, language)

        os.unlink(tmp_path)

        return {
            "text": transcript.text,
            "language": language,
            "context": context,
            "word_count": len(transcript.text.split()),
            "success": True,
        }
    except Exception as e:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "text": "",
                "success": False,
            },
        )


@router.post("/whisper/analyze-voice")
async def analyze_voice(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
    context: str = Form(default="security"),
    message_type: str = Form(default="voice"),
    sender_info: str = Form(default="Unknown"),
    clerk_user_id: str = Form(default="anonymous"),
):
    tmp_path = None
    try:
        tmp_path = _save_temp_audio(audio)
        transcript = _transcribe_file(tmp_path, language)
        transcribed_text = transcript.text.strip()
        os.unlink(tmp_path)

        result = await analyze_message(
            transcribed_text,
            message_type=message_type,
            sender_info=sender_info,
            processing_mode="LOCAL-ONLY + WHISPER",
        )
        result["transcribed_text"] = transcribed_text
        result["audio_context"] = context

        await save_phishing_analysis(
            {
                "clerk_user_id": clerk_user_id,
                "message_preview": transcribed_text[:200],
                "message_type": "voice",
                "risk_score": result["risk_score"],
                "risk_level": result["risk_level"],
                "verdict": result["verdict"],
                "attack_type": result.get("attack_type"),
                "is_phishing": result["is_phishing"],
                "india_specific_scam": result.get("india_specific_scam"),
                "full_result": result,
            }
        )

        return result
    except Exception as e:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "transcribed_text": "",
                "success": False,
            },
        )
