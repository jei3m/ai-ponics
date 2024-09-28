import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import "./css/Forum.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faComment, faDeleteLeft, faPlus, faTrash} from '@fortawesome/free-solid-svg-icons';

function Forum() {
  const [forums, setForums] = useState([]);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumContent, setNewForumContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedForum, setSelectedForum] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const quillRef = useRef(null);

  useEffect(() => {
    const fetchForums = async () => {
      const querySnapshot = await getDocs(collection(db, 'forums'));
      const forumsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setForums(forumsData);
    };
    fetchForums();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const handlePostForum = async () => {
    if (newForumTitle.trim() !== '' && newForumContent.trim() !== '') {
      const newForum = {
        title: newForumTitle,
        content: newForumContent,
        comments: [],
        postedBy: currentUser,
        authorName: auth.currentUser.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'forums'), newForum);
      setNewForumTitle('');
      setNewForumContent('');
      setForums([...forums, { ...newForum, id: docRef.id }]);
      setShowModal(false);
    }
  };

  const handleComment = async () => {
    if (newComment.trim() !== '' && selectedForum) {
      const forumRef = doc(db, 'forums', selectedForum.id);
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
      setSelectedForum({
        ...selectedForum,
        comments: [...selectedForum.comments, newCommentObj],
      });
    }
  };

  const handleSelectForum = (forum) => {
    setSelectedForum(forum);
    setShowDetailedView(true);
  };

  const handleDeleteForum = async (id) => {
    if (currentUser) {
      const forumRef = doc(db, 'forums', id);
      const forumData = forums.find((forum) => forum.id === id);
      if (forumData.postedBy === currentUser) {
        await deleteDoc(forumRef);
        setForums(forums.filter((forum) => forum.id !== id));
        setShowDetailedView(false);
      } else {
        alert('You do not have permission to delete this forum.');
      }
    } else {
      alert('Please log in to delete this forum.');
    }
  };

  const handleDeleteComment = async (commentIndex) => {
    if (currentUser && selectedForum) {
      const forumRef = doc(db, 'forums', selectedForum.id);
      if (selectedForum.comments[commentIndex].postedBy === currentUser) {
        const updatedComments = selectedForum.comments.filter(
          (_, index) => index !== commentIndex
        );
        await updateDoc(forumRef, { comments: updatedComments });
        setSelectedForum({
          ...selectedForum,
          comments: updatedComments,
        });
      } else {
        alert('You do not have permission to delete this comment.');
      }
    } else {
      alert('Please log in to delete this comment.');
    }
  };

  const handleBackToForums = () => {
    setShowDetailedView(false);
    setSelectedForum(null);
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

  return (
    <div>
    <div className="forum-container">
      {showDetailedView ? (
        <div className="detailed-view">
          <h1 className="forum-title">{selectedForum.title}</h1>
          <p className="forum-author">Posted by: {selectedForum.authorName}</p>
          <p className="forum-date">Created on: {new Date(selectedForum.createdAt).toLocaleString()}</p>
          <div className="forum-content" dangerouslySetInnerHTML={{ __html: selectedForum.content }} />

          <h3 style={{marginTop:'100px', marginBottom:'-10px'}}>Comments:</h3>
          <div className="comment-input">
            <ReactQuill
              ref={quillRef}
              modules={modules}
              value={newComment}
              onChange={setNewComment}
              placeholder="Comment on this forum"
              className='ql-comment'
              style={{minHeight:'10em'}}
            />
            <div className='button-group'> 
            <button onClick={handleBackToForums} className="button-back"><FontAwesomeIcon icon={faArrowLeft}/> Back</button>
            <button onClick={handleComment} className="forum-button-detailed"><FontAwesomeIcon icon={faComment}/> Comment
            </button>
            </div>
          </div>
          <ul className="comment-list">
            {selectedForum.comments.map((comment, index) => (
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
      ) : (
        <div className='home-forum'>
          <h1 className="forum-title">Forums</h1>
          <button onClick={() => setShowModal(true)} className="forum-button">Create New Forum <FontAwesomeIcon icon={faPlus}/></button>
          {showModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>Create New Forum</h2>
                <input
                  type="text"
                  value={newForumTitle}
                  onChange={(e) => setNewForumTitle(e.target.value)}
                  placeholder="Title of your forum"
                  className="forum-input-field"
                  style={{borderRadius:'6px'}}
                />
                <ReactQuill
                  ref={quillRef}
                  modules={modules}
                  value={newForumContent}
                  onChange={setNewForumContent}
                  placeholder="Content of your forum"
                  className='ql-modal'
                />
                <button onClick={() => setShowModal(false)} className="button-back">Cancel</button>
                <button onClick={handlePostForum} className="forum-button" style={{marginLeft:'10px'}}>Post</button>
              </div>
            </div>
          )}
          <ul className="forum-list">
            {forums.map((forum) => (
              <a onClick={() => handleSelectForum(forum)}>
              <li key={forum.id} className="forum-item">
                <h2 className="forum-item-title">{forum.title}</h2>
                <p className="forum-item-author">Posted by: {forum.authorName}</p>
                <p className="forum-item-date">{new Date(forum.createdAt).toLocaleString()}</p>
                {/* <button onClick={() => handleSelectForum(forum)} className="forum-button">View</button> */}
                {currentUser && forum.postedBy === currentUser && (
                  <button onClick={() => handleDeleteForum(forum.id)} className="delete-button"><FontAwesomeIcon icon={faTrash} style={{color:'grey'}}/> Delete</button>
                )}
              </li>
              </a>
            ))}
          </ul>
        </div>
      )}
    </div>
    </div>
  );
}

export default Forum;