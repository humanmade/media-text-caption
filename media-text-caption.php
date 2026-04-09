<?php
/**
 * Plugin Name: GFO Media & Text Caption
 * Description: Adds an optional figcaption field to the core/media-text block.
 * Version:     1.0.0
 * Author:      Human Made Limited
 * License:     GPL-2.0-or-later
 * Text Domain: gfo
 *
 * @package GFO_Media_Text_Caption
 */

namespace GFO\MediaTextCaption;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue the editor script.
 */
function enqueue_editor_script(): void {
	$asset_file = __DIR__ . '/build/index.asset.php';

	if ( ! is_readable( $asset_file ) ) {
		_doing_it_wrong( __FUNCTION__, 'GFO Media & Text Caption: build files missing. Run npm run build.', '1.0.0' );
		return;
	}

	$asset = require $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable

	wp_enqueue_script(
		'gfo-media-text-caption-editor',
		plugins_url( 'build/index.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version']
	);

	wp_enqueue_style(
		'gfo-media-text-caption-editor-style',
		plugins_url( 'build/style-index.css', __FILE__ ),
		[],
		$asset['version']
	);
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\\enqueue_editor_script' );

/**
 * Enqueue the frontend stylesheet.
 */
function enqueue_frontend_style(): void {
	$asset_file = __DIR__ . '/build/index.asset.php';
	if ( ! is_readable( $asset_file ) ) {
		return;
	}
	$asset = require $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable

	wp_enqueue_style(
		'gfo-media-text-caption',
		plugins_url( 'build/style-index.css', __FILE__ ),
		[],
		$asset['version']
	);
}
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_frontend_style' );

/**
 * Inject the figcaption into the rendered block when a caption is set.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Block data including attributes.
 * @return string
 */
function render_media_caption( string $block_content, array $block ): string {
	if ( 'core/media-text' !== $block['blockName'] ) {
		return $block_content;
	}

	$show_caption = $block['attrs']['showMediaCaption'] ?? false;
	if ( ! $show_caption ) {
		return $block_content;
	}

	$caption = $block['attrs']['mediaCaption'] ?? '';
	if ( empty( $caption ) ) {
		return $block_content;
	}

	$safe_caption = wp_kses_post( $caption );

	return preg_replace_callback(
		'/(<figure\b[^>]*\bwp-block-media-text__media\b[^>]*>.*?<\/figure>)/s',
		function( $matches ) use ( $safe_caption ) {
			return $matches[1] . '<figcaption class="wp-element-caption gfo-media-caption">' . $safe_caption . '</figcaption>';
		},
		$block_content,
		1
	);
}
add_filter( 'render_block', __NAMESPACE__ . '\\render_media_caption', 10, 2 );
