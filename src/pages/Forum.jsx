import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import "./css/Forum.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Loading from './Loading';

function Forum() {
  const [forums, setForums] = useState([]);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumContent, setNewForumContent] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  
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

  const handleDeleteForum = async (id) => {
    if (currentUser) {
      const forumRef = doc(db, 'forums', id);
      const forumData = forums.find((forum) => forum.id === id);
      if (forumData.postedBy === currentUser) {
        await deleteDoc(forumRef);
        setForums(forums.filter((forum) => forum.id !== id));
      } else {
        alert('You do not have permission to delete this forum.');
      }
    } else {
      alert('Please log in to delete this forum.');
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

  return (
    <div>
      <Header/>
      <br/><br/><br/>
      <div className="forum-container">
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
              <li key={forum.id} className="forum-item">
                <Link to={`/forum/${forum.id}`} style={{ textDecoration: 'none'}}>
                <h2 className="forum-item-title">{forum.title}</h2>
                <p className="forum-item-author">Posted by: {forum.authorName}</p>
                <p className="forum-item-date">{new Date(forum.createdAt).toLocaleString()}</p>
                </Link>
                {currentUser && forum.postedBy === currentUser && (
                  <button onClick={() => handleDeleteForum(forum.id)} className="delete-button"><FontAwesomeIcon icon={faTrash} style={{color:'grey'}}/> Delete</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Forum;