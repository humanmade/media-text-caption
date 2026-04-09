/**
 * Media & Text — Caption extension.
 *
 * Adds an editable figcaption field to the core/media-text block,
 * both in the editor sidebar and on the frontend.
 */

import './style.css';
import { addFilter } from '@wordpress/hooks';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, TextareaControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const BLOCK_NAME = 'core/media-text';

// Register the showMediaCaption and mediaCaption attributes.
addFilter(
	'blocks.registerBlockType',
	'gfo/media-text-caption/attributes',
	( settings, name ) => {
		if ( name !== BLOCK_NAME ) {
			return settings;
		}
		return {
			...settings,
			attributes: {
				...settings.attributes,
				showMediaCaption: {
					type: 'boolean',
					default: false,
				},
				mediaCaption: {
					type: 'string',
					default: '',
				},
			},
		};
	}
);

// Inspector controls + inject caption preview into the editor DOM.
const withMediaCaptionControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( props.name !== BLOCK_NAME ) {
			return <BlockEdit { ...props } />;
		}

		const { attributes, setAttributes, clientId } = props;
		const { showMediaCaption, mediaCaption, mediaId } = attributes;

		// Fetch the caption from the media library for the selected image.
		const libraryCaption = useSelect(
			( select ) => {
				if ( ! mediaId ) return '';
				const media = select( 'core' ).getMedia( mediaId );
				return media?.caption?.raw ?? '';
			},
			[ mediaId ]
		);

		// When the image changes and mediaCaption is empty, pre-fill from the library.
		// Uses a ref to avoid re-filling after the user manually clears the field.
		const autoFilledForMediaId = useRef( null );
		useEffect( () => {
			if ( ! mediaId || ! libraryCaption ) return;
			if ( mediaCaption ) return; // user has custom content, don't overwrite
			if ( autoFilledForMediaId.current === mediaId ) return; // already auto-filled for this image

			autoFilledForMediaId.current = mediaId;
			setAttributes( { mediaCaption: libraryCaption } );
		}, [ mediaId, libraryCaption, mediaCaption, setAttributes ] );

		// Inject or remove the figcaption preview in the editor DOM.
		useEffect( () => {
			const findBlock = () => {
				const sel = `[data-block="${ clientId }"]`;
				const el = document.querySelector( sel );
				if ( el ) return { el, doc: document };
				for ( const frame of document.querySelectorAll( 'iframe' ) ) {
					try {
						const fd = frame.contentDocument;
						if ( ! fd ) continue;
						const found = fd.querySelector( sel );
						if ( found ) return { el: found, doc: fd };
					} catch ( e ) {}
				}
				return null;
			};

			const found = findBlock();
			if ( ! found ) return;
			const { el: blockEl, doc } = found;

			// Remove any previously injected caption.
			const existing = blockEl.querySelector( '.gfo-editor-caption' );
			if ( existing ) existing.remove();

			if ( ! showMediaCaption || ! mediaCaption ) return;

			const figure = blockEl.querySelector( '.wp-block-media-text__media' );
			if ( ! figure ) return;

			const cap = doc.createElement( 'figcaption' );
			cap.className = 'wp-element-caption gfo-editor-caption';
			cap.textContent = mediaCaption;
			// Inject after </figure> (not inside) to avoid overflow:hidden clipping.
			figure.insertAdjacentElement( 'afterend', cap );
		}, [ showMediaCaption, mediaCaption, clientId ] );

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody title={ __( 'Media caption', 'gfo-admin' ) }>
						<ToggleControl
							label={ __( 'Show caption', 'gfo-admin' ) }
							checked={ !! showMediaCaption }
							onChange={ ( value ) =>
								setAttributes( { showMediaCaption: value } )
							}
						/>
						{ showMediaCaption && (
							<TextareaControl
								label={ __( 'Caption text', 'gfo-admin' ) }
								value={ mediaCaption ?? '' }
								onChange={ ( value ) =>
									setAttributes( { mediaCaption: value } )
								}
								help={
									libraryCaption && mediaCaption !== libraryCaption
										? __( 'Edited. ', 'gfo-admin' ) +
										  /* eslint-disable-next-line jsx-a11y/anchor-is-valid */
										  <button
										  	type="button"
										  	className="button-link"
										  	onClick={ () => setAttributes( { mediaCaption: libraryCaption } ) }
										  >
										  	{ __( 'Reset to image caption', 'gfo-admin' ) }
										  </button>
										: __( 'Displayed as a visible caption below the media.', 'gfo-admin' )
								}
							/>
						) }
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}, 'withMediaCaptionControl' );

addFilter(
	'editor.BlockEdit',
	'gfo/media-text-caption/inspector',
	withMediaCaptionControl
);
