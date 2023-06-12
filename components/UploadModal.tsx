'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, FieldValues, SubmitHandler } from "react-hook-form"
import { toast } from "react-hot-toast"
import uniqid from 'uniqid'
import { useSupabaseClient } from "@supabase/auth-helpers-react"

import useUploadModal from "@/hooks/useUploadModal"
import Modal from "./Modal"
import Input from "./Input"
import Button from "./Button"
import { useUser } from "@/hooks/useUser"

const UploadModal = () => {

  const [isLoading, setIsLoading] = useState(false)
  
  const uploadModal = useUploadModal()
  const { user } = useUser()
  const router = useRouter()
  const supabaseClient = useSupabaseClient()

  const {
    register,
    handleSubmit,
    reset
  } = useForm<FieldValues>({
    defaultValues: {
      author: '',
      title: '',
      song: null,
      image: null
    }
  })
  
  const onChange = (open: boolean) => {
    if(!open) {
      reset()
      uploadModal.onClose()
    }
  }

  const onSubmit: SubmitHandler<FieldValues> = async(data) => {
    try {
      setIsLoading(true)

      const imageFile = data.image?.[0]
      const songFile = data.song?.[0]

      if(!imageFile || !songFile || !user) return toast.error("Missing Fields")

      const uniqueID = uniqid()

      // Upload song
      const {
        data: songData, 
        error: songError 
      } = await supabaseClient
        .storage
        .from('songs')
        .upload(`song-${data.title}-${uniqueID}`, songFile, 
          { cacheControl: '3600', upsert: false }
        )
      
      if(songError) {
        setIsLoading(false)
        return toast.error("Failed song upload")
      }

      // Upload image
      const {
        data: imageData,
        error: imageError
      } = await supabaseClient
        .storage
        .from('images')
        .upload(`image-${data.title}-${uniqueID}`, imageFile, 
          { cacheControl: '3600', upsert: false }
        )
      
      if(imageError) {
        setIsLoading(false)
        return toast.error("Failed image upload")
      }

      // Insert into table
      const { error: supabaseError } = await supabaseClient.from('songs').insert({
        user_id: user.id,
        title: data.title,
        author: data.author,
        image_path: imageData.path,
        song_path: songData.path
      })

      if(supabaseError) {
        setIsLoading(false)
        return toast.error(supabaseError.message)
      }

      router.refresh();
      setIsLoading(false)
      toast.success("Song uploaded")
      reset()
      uploadModal.onClose()

    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <Modal
      title="Add a song"
      description="Upload an mp3 file"
      isOpen={uploadModal.isOpen}
      onChange={onChange}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
        <Input 
          id="title"
          disabled={isLoading}
          placeholder="Song Title"
          { ...register('title', { required: true })}
        />
        <Input 
          id="author"
          disabled={isLoading}
          placeholder="Song Author"
          { ...register('author', { required: true })}
        />
        <div>
          <div className="pb-1">
            Select a song file
          </div>
          <Input 
            id="song"
            type="file"
            disabled={isLoading}
            accept=".mp3"
            { ...register('song', { required: true })}
          />
        </div>
        <div>
          <div className="pb-1">
            Select an image
          </div>
          <Input 
            id="image"
            type="file"
            disabled={isLoading}
            accept="image/*"
            { ...register('image', { required: true })}
          />
        </div>
        <Button
          disabled={isLoading}
          type="submit"
        >
          Create
        </Button>
      </form>
    </Modal>
  )
}

export default UploadModal