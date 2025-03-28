export default class EventRegistry {
	constructor(componentId) {
	  this.componentId = componentId;
	  this.handlers = new Map();
	}
	
	register(elementId, eventType, handler) {
	  const key = `${eventType}:${elementId}`;
	  this.handlers.set(key, handler);
	  return this;
	}
	
	registerPrefix(prefix, eventTypes, handler) {
	  this.handlers.set(`prefix:${prefix}`, { eventTypes, handler });
	  return this;
	}
	
	handleEvent(event) {
	  const { type, target } = event;
	  const exactKey = `${type}:${target.id}`;
	  
	  // Check for exact match
	  if (this.handlers.has(exactKey)) {
		 this.handlers.get(exactKey)(event);
		 return true;
	  }
	  
	  // Check for prefix match
	  for (const [key, config] of this.handlers.entries()) {
		 if (key.startsWith('prefix:')) {
			const prefix = key.slice(7);
			if (target.id.startsWith(prefix) && config.eventTypes.includes(type)) {
			  const index = target.id.split(/-/g).pop();
			  config.handler(event, index);
			  return true;
			}
		 }
	  }
	  
	  return false;
	}
	
	attach(rootElement) {
	  const element = typeof rootElement === 'string' 
		 ? document.getElementById(rootElement) 
		 : rootElement;
		 
	  const eventTypes = new Set();
	  for (const [key, handler] of this.handlers.entries()) {
		 if (key.startsWith('prefix:')) {
			handler.eventTypes.forEach(type => eventTypes.add(type));
		 } else {
			eventTypes.add(key.split(':')[0]);
		 }
	  }
	  
	  eventTypes.forEach(type => {
		 element.addEventListener(type, this.handleEvent.bind(this));
	  });
	}
 }