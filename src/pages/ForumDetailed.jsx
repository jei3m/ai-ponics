import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import "./css/Forum.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faComment, faTrash } from '@fortawesome/free-solid-svg-icons';
import Loading from './Loading';

function DetailedView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [forum, setForum] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchForum = async () => {
      const docRef = doc(db, 'forums', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setForum({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such document!");
      }
    };
    fetchForum();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, [id]);

  const handleComment = async () => {
    if (newComment.trim() !== '' && forum) {
      const forumRef = doc(db, 'forums', forum.id);
      const newCommentObj = {
        comment: newComment,
        postedBy: currentUser,
        authorName: auth.currentUser.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
      };
      await updateDoc(forumRef, {
        comments: arrayUnion(newCommentObj),
      });
      setNewComment('');
      setForum({
        ...forum,
        comments: [...forum.comments, newCommentObj],
      });
    }
  };

  const handleDeleteComment = async (commentIndex) => {
    if (currentUser && forum) {
      const forumRef = doc(db, 'forums', forum.id);
      if (forum.comments[commentIndex].postedBy === currentUser) {
        const updatedComments = forum.comments.filter(
          (_, index) => index !== commentIndex
        );
        await updateDoc(forumRef, { comments: updatedComments });
        setForum({
          ...forum,
          comments: updatedComments,
        });
      } else {
        alert('You do not have permission to delete this comment.');
      }
    } else {
      alert('Please log in to delete this comment.');
    }
  };

  const TOOL_BAR_OPTIONS = [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
  ];
  
  const modules = {
    toolbar: {
      container: TOOL_BAR_OPTIONS,
    },
  };

  if (!forum) return <div><Loading/></div>;

  return (
    <div>
      <div className="forum-container">
        <div className="detailed-view">
          <h1 className="forum-title">{forum.title}</h1>
          <p className="forum-author">Posted by: {forum.authorName}</p>
          <p className="forum-date">Created on: {new Date(forum.createdAt).toLocaleString()}</p>
          <div className="forum-content" dangerouslySetInnerHTML={{ __html: forum.content }} />

          <h3 style={{marginTop:'100px', marginBottom:'-10px'}}>Comments:</h3>
          <div className="comment-input">
            <ReactQuill
              modules={modules}
              value={newComment}
              onChange={setNewComment}
              placeholder="Comment on this forum"
              className='ql-comment'
              style={{minHeight:'10em'}}
            />
            <div className='button-group'> 
              <button onClick={() => navigate('/forum')} className="button-back"><FontAwesomeIcon icon={faArrowLeft}/> Back</button>
              <button onClick={handleComment} className="forum-button-detailed"><FontAwesomeIcon icon={faComment}/> Comment</button>
            </div>
          </div>
          <ul className="comment-list">
            {forum.comments.map((comment, index) => (
              <li key={index} className="comment-item">
                <p className="comment-author">{comment.authorName}</p>
                <p className="comment-date">{new Date(comment.createdAt).toLocaleString()}</p>
                <div className="comment-text" dangerouslySetInnerHTML={{ __html: comment.comment }} />
                {currentUser && comment.postedBy === currentUser && (
                  <button onClick={() => handleDeleteComment(index)} className="delete-button"><FontAwesomeIcon icon={faTrash} style={{color:'grey'}}/> Delete</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DetailedView;