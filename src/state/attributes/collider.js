const initialState = {
  isSolid: false,
  collisionAction: { self: { type: "removeEntity" } }
};

export const createCollider = (collisionAction, isSolid) => ({
  ...initialState,
  collisionAction,
  isSolid
});

export const isSolid = entity => entity.collider.isSolid;
export const getCollisionAction = entity =>
  entity.collider ? entity.collider.collisionAction : {};
