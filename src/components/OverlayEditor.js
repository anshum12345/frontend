import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const EditorContainer = styled.div`
  margin: 20px auto;
  max-width: 800px;
  padding: 20px;
  border: 1px solid #ddd;
`;

const OverlayEditor = ({ overlays, onOverlayAdded, onOverlayUpdated, onOverlayDeleted }) => {
  const [newOverlay, setNewOverlay] = useState({
    type: 'text',
    content: '',
    x: 0,
    y: 0,
    width: '100px',
    height: '50px'
  });
  const [editingId, setEditingId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOverlay(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/overlays/${editingId}`, newOverlay);
        onOverlayUpdated(editingId, newOverlay);
        setEditingId(null);
      } else {
        const response = await axios.post('/api/overlays', newOverlay);
        onOverlayAdded({ ...newOverlay, _id: response.data.id });
      }
      setNewOverlay({
        type: 'text',
        content: '',
        x: 0,
        y: 0,
        width: '100px',
        height: '50px'
      });
    } catch (error) {
      console.error('Error saving overlay:', error);
    }
  };

  const handleEdit = (overlay) => {
    setNewOverlay({
      type: overlay.type,
      content: overlay.content,
      x: overlay.x,
      y: overlay.y,
      width: overlay.width,
      height: overlay.height
    });
    setEditingId(overlay._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/overlays/${id}`);
      onOverlayDeleted(id);
      if (editingId === id) {
        setEditingId(null);
        setNewOverlay({
          type: 'text',
          content: '',
          x: 0,
          y: 0,
          width: '100px',
          height: '50px'
        });
      }
    } catch (error) {
      console.error('Error deleting overlay:', error);
    }
  };

  return (
    <EditorContainer>
      <h3>{editingId ? 'Edit Overlay' : 'Add New Overlay'}</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Type:
            <select name="type" value={newOverlay.type} onChange={handleInputChange}>
              <option value="text">Text</option>
              <option value="image">Image</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Content:
            {newOverlay.type === 'text' ? (
              <input
                type="text"
                name="content"
                value={newOverlay.content}
                onChange={handleInputChange}
                required
              />
            ) : (
              <input
                type="url"
                name="content"
                value={newOverlay.content}
                onChange={handleInputChange}
                placeholder="Image URL"
                required
              />
            )}
          </label>
        </div>
        <div>
          <label>
            Width:
            <input
              type="text"
              name="width"
              value={newOverlay.width}
              onChange={handleInputChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Height:
            <input
              type="text"
              name="height"
              value={newOverlay.height}
              onChange={handleInputChange}
              required
            />
          </label>
        </div>
        <button type="submit">{editingId ? 'Update' : 'Save'} Overlay</button>
        {editingId && (
          <button type="button" onClick={() => setEditingId(null)}>
            Cancel
          </button>
        )}
      </form>

      <h4>Saved Overlays</h4>
      <ul>
        {overlays.map(overlay => (
          <li key={overlay._id}>
            {overlay.type} - {overlay.content.substring(0, 20)}...
            <button onClick={() => handleEdit(overlay)}>Edit</button>
            <button onClick={() => handleDelete(overlay._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </EditorContainer>
  );
};

export default OverlayEditor;